# python tools/ec-sounds.py -> public/art/sfx/<name>.wav : original-client effects (s0/s1 .dat = plain RIFF WAV)
# for the names in SFX; wire them in src/data/artOverrides.ts SFX_OVERRIDES. The client has no name table,
# so ids are assigned by ear (scratchpad sound-picker artifact) — keep this dict the single source of truth.
import os, shutil
D = r'D:/이터널시티/Data'  # original client, never committed
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art', 'sfx'))
SFX = {  # game sfx name (or 'shot:<WeaponClass>') -> s-file id
}
os.makedirs(OUT, exist_ok=True)
for name, sid in SFX.items():
    shutil.copyfile(f'{D}/{sid}.dat', f'{OUT}/{name.replace(":", "_")}.wav')
    print(name, sid)
print(len(SFX), '->', OUT)
