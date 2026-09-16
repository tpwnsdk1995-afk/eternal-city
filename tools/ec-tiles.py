# python tools/ec-tiles.py -> public/art/tiles.png : 32px seamless ground swatches cut from the original
# client's pre-rendered map pieces (.btx = DDS chunks). Strip order = TILE_SWATCHES in draw/tiles.ts.
import io, os, struct
import numpy as np
from PIL import Image

D = r'D:/이터널시티/Data'  # original client, never committed
T = 32
# name, btx, chunk, x, y, size  — square crop, downscaled to T (original ground scale ≈ 2.5× ours)
SWATCHES = [
    ('asphalt', '00016', 36, 640, 720, 80),
    ('sidewalk', '00016', 10, 620, 420, 64),
    ('concrete', '00016', 10, 90, 330, 96),
    ('dirt', '00016', 17, 470, 370, 128),
    ('grass', '00016', 14, 720, 400, 96),
]


def chunk(n, k):
    b = open(f'{D}/{n}.btx', 'rb').read()
    o = -4
    for _ in range(k + 1):
        o = b.find(b'DDS ', o + 4)
    h, w = struct.unpack_from('<II', b, o + 12)
    dxt = 8 if b[o + 84:o + 88] == b'DXT1' else 16
    return Image.open(io.BytesIO(b[o:o + 128 + ((w + 3) // 4) * ((h + 3) // 4) * dxt])).convert('RGB')


def seamless(a):
    """Edges come from the half-rolled copy (= the crop's centre), so the tile repeats without a seam."""
    b = np.roll(a, (T // 2, T // 2), (0, 1))
    yy, xx = np.mgrid[0:T, 0:T]
    w = np.clip(np.minimum(np.minimum(xx, T - 1 - xx), np.minimum(yy, T - 1 - yy)) / (T / 2 - 0.5), 0, 1)[..., None]
    return a * w + b * (1 - w)


strip = Image.new('RGB', (T * len(SWATCHES), T))
for i, (name, n, k, x, y, s) in enumerate(SWATCHES):
    im = chunk(n, k).crop((x, y, x + s, y + s)).resize((T, T), Image.LANCZOS)
    strip.paste(Image.fromarray(seamless(np.asarray(im, float)).round().astype(np.uint8)), (i * T, 0))
    print(name, n, k, (x, y, s))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art', 'tiles.png')
strip.save(out)
print('->', os.path.normpath(out), strip.size)
