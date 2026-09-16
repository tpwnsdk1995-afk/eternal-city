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
        if blob[p] != 1:
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


def layer_boxes(blob, fo):
    """-> [(w, h, ox, oy)] without decoding pixels"""
    out = []
    for i in range(u16(blob, fo)):
        p = u32(blob, fo + 2 + 8 * i)
        if blob[p] == 1:
            out.append((u16(blob, p + 1), u16(blob, p + 3), s16(blob, p + 5), s16(blob, p + 7)))
    return out


def auto_cell(blob, parts, part_ids, blocks, frames):
    """smallest even cell (w, h, anchor_y) holding every used frame with the origin at bottom-center"""
    half = up = down = 0
    for pi in part_ids:
        for b in blocks:
            for f in frames:
                if f < len(parts[pi][b]):
                    for w, h, ox, oy in layer_boxes(blob, parts[pi][b][f]):
                        half, up, down = max(half, ox, w - ox), max(up, oy), max(down, h - oy)
    return (2 * half + 4, up + down + 4, up + 2)


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
    cell = auto_cell(blob, parts, s['parts'], range(8), cols); cw, ch = cell[0], cell[1]
    sheet = Image.new('RGBA', (cw * 6, ch * 8))
    for d in range(8):
        block = (6 - d) % 8
        for c, fr in enumerate(cols):
            sheet.alpha_composite(compose(blob, pix_base, parts, s['parts'], block, fr, cell), (c * cw, d * ch))
    out = os.path.join(os.path.dirname(__file__), '..', 'public', 'art', f'{key}.png')
    sheet.save(out); print(f'wrote {os.path.normpath(out)} frameW={cw} frameH={ch}  -> data/artOverrides.ts')
    return
    if False:
        os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
        sp = os.path.join(os.path.dirname(__file__), 'out', f'{key}_strip.png'); st.save(sp); print('wrote', os.path.normpath(sp), n, 'frames')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('key'); ap.add_argument('--data', default=r'D:\이터널시티\Data'); ap.add_argument('--strip', action='store_true')
    a = ap.parse_args()
    for k in (SPRITES if a.key == 'all' else [a.key]):
        build(k, a.data, a.strip)
