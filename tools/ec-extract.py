r"""Eternal City 1 sprite extractor -> public/art/<key>.png

Reads the original client's .dat/.dta sprite containers and writes a figure sheet in the game's
layout (see systems/facing.ts): 8 rows = Dir 0..7 (E SE S SW W NW N NE), 6 cols = idle, walk x3, aim, death.

Usage: python tools/ec-extract.py <key|all> [--data "D:\이터널시티\Data"] [--strip]
  --strip also writes tools/out/<key>_strip.png (every source frame of the S row) for picking frame numbers.

Container format (reverse-engineered 2026-09-16):
  file : u8 0, u16 count, count x (u32 rid, u32 offset)
  blob : u32 len, u32 pixBase, u16 parts, u16 ?, u16 0, (parts-1) x u32 partOff   (part 0 follows the table)
  part : u16 blocks, u16 ?, u16 0, (blocks-1) x u32 blockOff                        (block = direction; block 8 = 1 preview frame)
  block: u16 n, n x u32 frameOff
  frame: u16 nLayers, nLayers x (u32 layerOff, u32 pixOff)
  layer: u8 type(0 empty, 1 sprite), u16 w, u16 h, s16 ox, s16 oy (origin = feet), then h rows of u16 n, n x (u8 skip, u8 run)
  pixels: RGB565 LE at pixBase + pixOff, one per run pixel in row order
Original block order is N NW W SW S SE E NE (counter-clockwise from north) -> game dir d uses block (6 - d) % 8.
"""
import argparse, os, struct, sys
from PIL import Image

# key -> source. parts: layer indices composited bottom-up. frames: source frame numbers inside a direction block.
SPRITES = {
    # 중곡동 zombies: 05020-05060.dat ids 13500-13504 (part 0 = sprite, part 1 = big preview)
    'zombie_casual_f': dict(file='05020.dat', rid=13500, parts=[0], frames=dict(idle=16, walk=[2, 4, 6], aim=11, death=34)),
    'zombie_suit_m': dict(file='05060.dat', rid=13504, parts=[0], frames=dict(idle=20, walk=[2, 4, 6], aim=11, death=35)),
    'zombie_stripe': dict(file='05040.dat', rid=13502, parts=[0], frames=dict(idle=18, walk=[2, 4, 6], aim=11, death=32)),
    'zombie_banshee': dict(file='05770.dat', rid=16246, parts=[0], frames=dict(idle=18, walk=[17, 20, 23], aim=10, death=35)),  # no walk cycle: glides with the idle sway (0-8 is a somersault leap)
    'zombie_office': dict(file='05030.dat', rid=13501, parts=[0], frames=dict(idle=20, walk=[2, 5, 8], aim=12, death=35)),
    'zombie_worker': dict(file='05050.dat', rid=13503, parts=[0], frames=dict(idle=14, walk=[1, 3, 5], aim=8, death=31)),
    # player: customizable male model 00046 (body, silver hair, blue jacket, jeans, sneakers); 0-11 idle, 12-23 walk,
    # 36-41 fall back and lie (walk 12 is skipped: its hair frame is corrupt facing up), 72-75 one-hand (pistol) fire, 76-90 two-hand (long gun) fire, 24-25 arm swing.
    # ponytail: weapons are separate 3-5px layers (parts 7/9/14/16) and are left out; one cell for all three so swaps keep the frame size
    'player': dict(file='00046.dat', rid=5478, cw=True, parts=[0, 4, 5, 6, 17], frames=dict(idle=0, walk=[14, 18, 22], aim=74, death=41), cell=[0, 14, 18, 22, 41, 74, 80, 25]),
    'player_long': dict(file='00046.dat', rid=5478, cw=True, parts=[0, 4, 5, 6, 17], frames=dict(idle=0, walk=[14, 18, 22], aim=80, death=41), cell=[0, 14, 18, 22, 41, 74, 80, 25]),
    'player_melee': dict(file='00046.dat', rid=5478, cw=True, parts=[0, 4, 5, 6, 17], frames=dict(idle=0, walk=[14, 18, 22], aim=25, death=41), cell=[0, 14, 18, 22, 41, 74, 80, 25]),
    # NPCs stand still (Npc.ts shows the S idle frame only), so every column is frame 0 and the sheet dedups to one pose per direction.
    # 03xxx/04xxx single-part figures (part 1 is the 1-frame preview); 00012 is a 3-part model (body, coat, hair).
    'npc_elia': dict(file='03960.dat', rid=6593, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # white blouse, grey skirt
    'npc_shop': dict(file='03880.dat', rid=6296, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # apron, hands on hips
    'npc_tech': dict(file='03990.dat', rid=6635, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # green jacket
    'npc_blackmarket': dict(file='03950.dat', rid=6579, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # all black
    'npc_storage': dict(file='04056.dat', rid=17094, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # hat, striped top
    'npc_mainstream': dict(file='03770.dat', rid=6122, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # white shirt, tie
    'npc_parallel': dict(file='04070.dat', rid=6687, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # white suit
    'npc_cyber': dict(file='04062.dat', rid=17536, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # blue bodysuit
    'npc_kimhun': dict(file='00061.dat', rid=5482, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # camo soldier at ease (03780 6125 is a crouched gunner)
    'npc_taxi': dict(file='04040.dat', rid=6664, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # blue uniform, cap
    'npc_assault': dict(file='00012.dat', rid=4305, parts=[0, 2, 1], frames=dict(idle=0, walk=[0, 0, 0], aim=0, death=0)),  # red coat, blonde
    # monsters (32): walk 0-9, attack 10-14, idle 20-29, hit+death 30-41 in most files; exceptions noted per line
    'zombie_dog': dict(file='00064.dat', rid=5498, parts=[0], frames=dict(idle=16, walk=[0, 3, 6], aim=24, death=47)),  # rottweiler: 0-9 trot, 20-29 bite, 40-47 rear up and drop
    'zombie_hardened': dict(file='05110.dat', rid=13666, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=35)),  # flail swing 10-12, lies at 35
    'ogurin': dict(file='04660.dat', rid=11329, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=34)),  # arm raise 10-14 (12 is 207px tall, skipped)
    'ogurin_mutant': dict(file='04670.dat', rid=11330, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=10, death=33)),  # blade swing 10; 33 sprawled, 34 is an empty frame
    'wito_recon': dict(file='04510.dat', rid=9949, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=14, death=34)),  # kick 14-16
    'wito_soldier': dict(file='00060.dat', rid=5481, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=31, death=41)),  # 9-block file; rifle fire 30-31
    'wito_airborne': dict(file='05880.dat', rid=16543, parts=[0], frames=dict(idle=16, walk=[0, 2, 4], aim=41, death=31)),  # walk 0-6, 26-31 drops rifle and falls, 40-42 aims
    'wito_elite': dict(file='04560.dat', rid=10232, parts=[0], frames=dict(idle=20, walk=[0, 4, 8], aim=16, death=48)),  # 0-11 walk, 12-16 kick, 30-37 sinks (unused), 46-49 fall
    'zombie_police': dict(file='05100.dat', rid=13665, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=34)),  # rifle fire 10-12
    'zombie_firefighter': dict(file='05570.dat', rid=15327, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=33)),  # overhead axe 10-11, flat at 33
    'wito_engineer': dict(file='05340.dat', rid=14526, parts=[0], frames=dict(idle=20, walk=[0, 2, 4], aim=10, death=16)),  # 27 frames only: 13-16 crumple
    'wito_turret': dict(file='05360.dat', rid=14563, parts=[0], frames=dict(idle=0, walk=[0, 0, 0], aim=13, death=38)),  # static: 13 muzzle flash, 34-38 wreck
    'zombie_fire_chief': dict(file='05120.dat', rid=13667, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=35)),  # whip 10-12, 40-48 more whips
    'zombie_soldier': dict(file='05070.dat', rid=13539, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=37, death=35)),  # rifle fire 36-39, lies 34-35
    'larva': dict(file='05650.dat', rid=15511, parts=[0], frames=dict(idle=20, walk=[1, 4, 7], aim=12, death=31)),  # 0-4 are odd crouches; slash 11-14; 31 flattened, 32-33 fragments
    'wito_elite_trooper': dict(file='05870.dat', rid=16544, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=31, death=36)),  # rifle fire 29-31 and 44-48
    'mongolian_deathworm': dict(file='05670.dat', rid=15665, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=40)),  # rears at 11, flat 38-40
    'guest_scout': dict(file='04774.dat', rid=17475, parts=[0], frames=dict(idle=70, walk=[0, 3, 6], aim=86, death=38)),  # GUEST rig (89 frames): 32-38 fall, 49-78 idles, 85-88 strike
    'guest_warrior': dict(file='04776.dat', rid=17485, parts=[0], frames=dict(idle=70, walk=[0, 3, 6], aim=86, death=38)),  # same rig
    'guest_hunter': dict(file='04775.dat', rid=17476, parts=[0], frames=dict(idle=70, walk=[0, 3, 6], aim=86, death=38)),  # same rig (82-84 are a green-tinted variant, unused)
    'guest_elite': dict(file='04777.dat', rid=17527, parts=[0], frames=dict(idle=70, walk=[0, 3, 6], aim=86, death=38)),  # same rig
    'parasite_root': dict(file='00574.dat', rid=21472, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=12, death=38)),  # rooted mass: spike 11-13 (205px), topples 34-38
    'zombie_lord': dict(file='05130.dat', rid=13967, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=12, death=39)),  # arms spread 12, sprawled 38-40
    'wito_heavy_gunner': dict(file='03780.dat', rid=6125, parts=[0], frames=dict(idle=24, walk=[0, 3, 6], aim=12, death=36)),  # big gun held level 23-30; 10-14 barrel toward viewer; 35-36 down
    'zombie_ceo': dict(file='05800.dat', rid=16243, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=15)),  # 26 frames: cane swing 10-11, 12-15 collapses, 16-25 idle
    'zombie_riot_police': dict(file='05530.dat', rid=15222, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=44, death=35)),  # rifle level 43-45, lies 34-35
    'wito_drone': dict(file='05460.dat', rid=14852, parts=[0], frames=dict(idle=0, walk=[1, 2, 3], aim=8, death=20)),  # hover pod: lights cycle 0-15, 16-18 blast, 19-20 husk
    'parasite_spawn': dict(file='05210.dat', rid=14539, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=12, death=36)),  # legs spread 12, flattened 34-36
    'wito_commander': dict(file='05860.dat', rid=16494, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=11, death=15)),  # 26 frames like the ceo: 12-15 collapses
    'zombie_ancient': dict(file='04640.dat', rid=11327, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=30, death=33)),  # swing 29-31, flat 33-34
    'parasite_horror': dict(file='00773.dat', rid=21868, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=12, death=37)),  # pincers up 10-19, 31-37 shrivels
    'the_wise_one': dict(file='00191.dat', rid=20151, parts=[0], frames=dict(idle=20, walk=[0, 3, 6], aim=38, death=36)),  # tongue 10-19, bones 31-36, horn rears 37-40
}

u16 = lambda b, o: struct.unpack_from('<H', b, o)[0]
s16 = lambda b, o: struct.unpack_from('<h', b, o)[0]
u32 = lambda b, o: struct.unpack_from('<I', b, o)[0]


def load_blob(path, rid):
    b = open(path, 'rb').read()
    n = u16(b, 1)
    es = [(u32(b, 3 + 8 * i), u32(b, 7 + 8 * i)) for i in range(n)]
    for i, (r, off) in enumerate(es):
        if r == rid:
            return b[off:es[i + 1][1] if i + 1 < n else len(b)]
    raise KeyError(f'{rid} not in {path}')


def parts_of(blob):
    """-> (pixBase, [[[frameOff...] per block] per part])"""
    A = u16(blob, 8)
    part_offs = [14 + 4 * (A - 1)] + [u32(blob, 14 + 4 * i) for i in range(A - 1)]
    parts = []
    for po in part_offs:
        C = u16(blob, po)
        block_offs = [po + 6 + 4 * (C - 1)] + [u32(blob, po + 6 + 4 * i) for i in range(C - 1)]
        parts.append([[u32(blob, bo + 2 + 4 * i) for i in range(u16(blob, bo))] for bo in block_offs])
    return u32(blob, 4), parts


def layers_of(blob, pix_base, fo):
    """-> [(img RGBA, ox, oy)] for one frame"""
    out = []
    for i in range(u16(blob, fo)):
        p, pix = u32(blob, fo + 2 + 8 * i), u32(blob, fo + 6 + 8 * i)
        if not sane_layer(blob, p):  # a few frames (e.g. player shoes 99-104) carry dangling pointers
            continue
        w, h, ox, oy = u16(blob, p + 1), u16(blob, p + 3), s16(blob, p + 5), s16(blob, p + 7)
        img = Image.new('RGBA', (w, h)); px = img.load()
        r, q = p + 9, pix_base + pix
        for y in range(h):
            n = u16(blob, r); r += 2; x = 0
            for _ in range(n):
                x += blob[r]; run = blob[r + 1]; r += 2
                for _ in range(run):
                    v = u16(blob, q); q += 2
                    px[x, y] = ((v >> 11) * 255 // 31, ((v >> 5) & 63) * 255 // 63, (v & 31) * 255 // 31, 255); x += 1
        out.append((img, ox, oy))
    return out


def sane_layer(blob, p):
    """a layer header inside the blob with a plausible size; hair 00046 block 0 frame 12 points at garbage (hundreds of 60000px layers)"""
    return p + 9 <= len(blob) and blob[p] == 1 and 0 < u16(blob, p + 1) <= 256 and 0 < u16(blob, p + 3) <= 256


def layer_boxes(blob, fo):
    """-> [(w, h, ox, oy)] without decoding pixels"""
    out = []
    for i in range(u16(blob, fo)):
        p = u32(blob, fo + 2 + 8 * i)
        if sane_layer(blob, p):
            out.append((u16(blob, p + 1), u16(blob, p + 3), s16(blob, p + 5), s16(blob, p + 7)))
    return out


FEET = 36  # origin (feet) row below the cell centre: matches the drawn 48px figures (feet ~22 world px under the entity at scale 0.6)


def auto_cell(blob, parts, part_ids, blocks, frames):
    """smallest even cell (w, h, anchor_y) holding every used frame, origin at bottom-centre, centre-to-feet fixed"""
    half = up = down = 0
    for pi in part_ids:
        for b in blocks:
            for f in frames:
                if f < len(parts[pi][b]):
                    for w, h, ox, oy in layer_boxes(blob, parts[pi][b][f]):
                        half, up, down = max(half, ox, w - ox), max(up, oy), max(down, h - oy)
    ay = max(up + 2, down + 2 + 2 * FEET)
    return (2 * half + 4, 2 * (ay - FEET), ay)  # feet sit FEET px below the cell centre in every sheet


def compose(blob, pix_base, parts, part_ids, block, frame, cell):
    """one sheet cell: every requested part's layers anchored so the origin sits at bottom-center"""
    cw, ch, ay = cell
    img = Image.new('RGBA', (cw, ch))
    ax = cw // 2
    for pi in part_ids:
        frames = parts[pi][block]
        if frame >= len(frames):
            continue
        for lay, ox, oy in layers_of(blob, pix_base, frames[frame]):
            img.alpha_composite(lay, (max(0, ax - ox), max(0, ay - oy)))
    return img


def build(key, data, strip=False):
    s = SPRITES[key]
    blob = load_blob(os.path.join(data, s['file']), s['rid'])
    pix_base, parts = parts_of(blob)
    cols = [s['frames']['idle'], *s['frames']['walk'], s['frames']['aim'], s['frames']['death']]
    if strip:
        n = len(parts[0][4]); cols_n = 20
        cell = auto_cell(blob, parts, s['parts'], [4], range(n)); cw, ch = cell[0], cell[1]
        st = Image.new('RGBA', (cw * cols_n, ch * ((n + cols_n - 1) // cols_n)), (60, 60, 60, 255))
        from PIL import ImageDraw
        dr = ImageDraw.Draw(st)
        for f in range(n):
            x, y = (f % cols_n) * cw, (f // cols_n) * ch
            st.alpha_composite(compose(blob, pix_base, parts, s['parts'], 4, f, cell), (x, y)); dr.text((x + 2, y + 2), str(f), fill=(255, 255, 0, 255))
        os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
        sp = os.path.join(os.path.dirname(__file__), 'out', f'{key}_strip.png'); st.save(sp); print('wrote', os.path.normpath(sp), n, 'frames'); return
    cell = auto_cell(blob, parts, s['parts'], range(8), s.get('cell', cols)); cw, ch = cell[0], cell[1]
    sheet = Image.new('RGBA', (cw * 6, ch * 8))
    for d in range(8):
        block = (d + 2) % 8 if s.get('cw') else (6 - d) % 8  # player model 00046 stores blocks clockwise (N NE E ...): its E/W rows came out mirrored
        for c, fr in enumerate(cols):
            sheet.alpha_composite(compose(blob, pix_base, parts, s['parts'], block, fr, cell), (c * cw, d * ch))
    # idle head height above the frame centre (S block): Enemy hangs the name label / hp bar there instead of at the cell top
    top = max((oy for pi in s['parts'] for _, _, _, oy in layer_boxes(blob, parts[pi][4][s['frames']['idle']])), default=0) - FEET
    out = os.path.join(os.path.dirname(__file__), '..', 'public', 'art', f'{key}.png')
    sheet.save(out); print(f'wrote {os.path.normpath(out)} frameW={cw} frameH={ch} top={top}  -> data/artOverrides.ts')



if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('key'); ap.add_argument('--data', default=r'D:\이터널시티\Data'); ap.add_argument('--strip', action='store_true')
    a = ap.parse_args()
    for k in (SPRITES if a.key == 'all' else [a.key]):
        build(k, a.data, a.strip)
