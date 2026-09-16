# python tools/ec-ui.py -> public/art/ui_panel.png (256x48) + public/art/ui_button.png (20x20)
# 9-slice sources cut from the original client's UI: the MINI MAP window frame (00178.dat 17625 —
# hatched silver title band with chamfered corners, 2px silver sides, transparent inside) and the
# 닫기 button (00134.dat 20062 block 1). The panel interior gets the HUD's charcoal fill baked in.
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
spec = importlib.util.spec_from_file_location('ex', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ec-extract.py'))
ex = importlib.util.module_from_spec(spec); spec.loader.exec_module(ex)

D = r'D:/이터널시티/Data'  # original client, never committed
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art'))


def layer(file, rid, block=0, n=0):
    blob = ex.load_blob(f'{D}/{file}', rid); pb, parts = ex.parts_of(blob)
    return ex.layers_of(blob, pb, parts[0][block][0])[n][0]


def tile_x(src, w):
    """repeat a strip horizontally to width w"""
    out = Image.new('RGBA', (w, src.height))
    for x in range(0, w, src.width): out.paste(src, (x, 0))
    return out


# --- panel: 256x48, margins 8 (top band) / 2 (sides, bottom) — consumers slice it 8/8/8/8 ---
W, H, BAND = 256, 48, 8
src = layer('00178.dat', 17625)  # 204x110
sw, sh = src.size
panel = Image.new('RGBA', (W, H))
# charcoal fill (drawUiPanel's gradient) under everything but the chamfered corners
fill = Image.new('RGBA', (W, H))
for y in range(H):
    t = y / (H - 1); c = tuple(round(a + (b - a) * t) for a, b in ((30, 12), (31, 12), (34, 14)))
    fill.paste((*c, 245), (0, y, W, y + 1))
band = src.crop((0, 0, sw, BAND))  # top band incl. chamfers
# the band's hatch repeats every 4px: tile a 4-aligned strip from right of the baked-in "MINI MAP" text
inner = band.crop((132, 0, 196, BAND))
panel.paste(fill, (0, 0))
panel.paste(band.crop((0, 0, 8, BAND)), (0, 0), band.crop((0, 0, 8, BAND)))
panel.paste(band.crop((sw - 8, 0, sw, BAND)), (W - 8, 0), band.crop((sw - 8, 0, sw, BAND)))
mid = tile_x(inner, W - 16); panel.paste(mid, (8, 0), mid)
# chamfered corners stay transparent, like the original
for y in range(BAND):
    for x in range(W):
        if (x < 8 or x >= W - 8) and band.getpixel((x if x < 8 else sw - W + x, y))[3] == 0: panel.putpixel((x, y), (0, 0, 0, 0))
# sides + bottom: the original's plain 2px silver
side = src.crop((0, sh // 2, 2, sh // 2 + 1)).resize((2, H - BAND))
panel.paste(side, (0, BAND)); panel.paste(side, (W - 2, BAND))
bottom = src.crop((0, sh - 2, 1, sh)).resize((W, 2)); panel.paste(bottom, (0, H - 2))
panel.save(f'{OUT}/ui_panel.png'); print('ui_panel', panel.size)

# --- button: 81x31 닫기 (state 0) -> 20x20 = 10px corners, sliced 3/3/3/3 by consumers ---
b = layer('00134.dat', 20062, block=1)
bw, bh = b.size
btn = Image.new('RGBA', (20, 20))
for (sx, sy, dx, dy) in ((0, 0, 0, 0), (bw - 10, 0, 10, 0), (0, bh - 10, 0, 10), (bw - 10, bh - 10, 10, 10)):
    btn.paste(b.crop((sx, sy, sx + 10, sy + 10)), (dx, dy))
btn.save(f'{OUT}/ui_button.png'); print('ui_button', btn.size)
