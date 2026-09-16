# python tools/ec-icons.py -> public/art/icon_<key>.png (64x64, transparent): item icons cut from the original client.
# 03xxx part 1 = equipment preview image; 01xxx/07xxx = small consumable props. Tiny sources are pixel-doubled
# (NEAREST) so they stay crisp; big ones are LANCZOS-fitted. Ammo kinds share the one original ammo box, colorised.
import os, importlib.util
from PIL import Image, ImageOps
spec = importlib.util.spec_from_file_location('ex', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ec-extract.py'))
ex = importlib.util.module_from_spec(spec); spec.loader.exec_module(ex)
D = r'D:/이터널시티/Data'  # original client, never committed
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art'))
SZ, FIT = 64, 58

# key: (file, rid, part)
ICONS = {
    'armor_top': ('03856', 6594, 1),     # camo tactical vest
    'armor_bottom': ('03982', 9707, 1),  # khaki cargo pants
    'armor_coat': ('03946', 8502, 1),    # black trench coat
    'armor_shoes': ('03983', 9708, 1),   # brown boots
    'armor_hat': ('03933', 7996, 1),     # helmet
    'armor_wig': ('03947', 8547, 1),     # black hair
    'energy_drink': ('07155', 23674, 0), # pink can
    'ammo_normal': ('07727', 24444, 0),  # grey ammo box
    'bandage': ('01677', 4377, 0),       # white roll
    'painkiller': ('01678', 4398, 0),    # yellow pill bottle
    'hp_pack': ('01680', 4458, 0),       # red/white pack
    'syringe': ('01785', 4708, 0),       # white bottle with nozzle
    'ampoule': ('01756', 3866, 0),       # green capsule
    'lens': ('01848', 5691, 0),          # dark disc
    'ticket': ('01686', 3342, 0),        # red ticket
    'coupon': ('01686', 3340, 0),        # red ticket, folded
    'document': ('01692', 3417, 0),      # white paper
}
# ammo variants = the same box, colorised (the original has one box graphic)
AMMO_TINT = {'ammo_ap': (120, 150, 210), 'ammo_incendiary': (235, 140, 50), 'ammo_shell': (210, 70, 60),
             'ammo_slug': (150, 90, 60), 'ammo_grenade': (120, 150, 80)}


def layer(file, rid, part):
    blob = ex.load_blob(f'{D}/{file}.dat', rid); pb, parts = ex.parts_of(blob)
    return ex.layers_of(blob, pb, parts[part][0][0])[0][0]


def fit(img):
    s = min(FIT / img.width, FIT / img.height)
    if s >= 2: s = int(s); img = img.resize((img.width * s, img.height * s), Image.NEAREST)
    elif s < 1: img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    out = Image.new('RGBA', (SZ, SZ), (0, 0, 0, 0)); out.paste(img, ((SZ - img.width) // 2, (SZ - img.height) // 2), img)
    return out


def tint(img, rgb):
    a = img.getchannel('A'); g = ImageOps.colorize(img.convert('L'), (0, 0, 0), (255, 255, 255), mid=rgb).convert('RGBA'); g.putalpha(a)
    return g


made = {}
for key, (f, rid, part) in ICONS.items():
    made[key] = fit(layer(f, rid, part)); made[key].save(f'{OUT}/icon_{key}.png'); print(key, f, rid, part)
for key, rgb in AMMO_TINT.items():
    tint(made['ammo_normal'], rgb).save(f'{OUT}/icon_{key}.png'); print(key, 'tint', rgb)
