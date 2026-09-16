# python tools/ec-sounds.py -> public/art/sfx/<name>.wav : original-client effects (s0/s1 .dat = plain RIFF WAV)
# for the names in SFX; wire them in src/data/artOverrides.ts SFX_OVERRIDES. The client has no name table,
# so ids were assigned from waveform features (length/attack/decay/burst count/spectrum; the s0359~s0383 block is the loud gunshot family); swap by ear if one sounds off — keep this dict the single source of truth.
import os, shutil
D = r'D:/이터널시티/Data'  # original client, never committed
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'art', 'sfx'))
SFX = {  # game sfx name (or 'shot:<WeaponClass>') -> s-file id
    'shot:권총': 's0359',
    'shot:기관단총': 's0367',
    'shot:돌격소총': 's0360',
    'shot:산탄총': 's0374',
    'shot:저격소총': 's0376',
    'shot:기관총': 's0369',
    'shot:근접무기': 's0606',
    'shot:투척중화기': 's0383',
    'shot:변이무기': 's0681',
    'shot': 's0362',
    'swing': 's0606',
    'launch': 's0383',
    'explode': 's0690',
    'hit_flesh': 's0683',
    'hit_crit': 's0698',
    'hit_wall': 's0666',
    'enemy_die': 's1353',
    'enemy_shot': 's0362',
    'enemy_leap': 's1350',
    'player_hurt': 's1045',
    'player_die': 's1048',
    'consciousness': 's0219',
    'level_up': 's0210',
    'pickup_won': 's0214',
    'pickup_item': 's0555',
    'ui_open': 's0291',
    'ui_close': 's0293',
    'ui_click': 's0223',
    'quest_done': 's0211',
    'assault_success': 's0217',
    'assault_fail': 's0216',
    'jump': 's0607',
    'no_ammo': 's0660',
    'heal': 's0559',
    'enhance_ok': 's0221',
    'enhance_fail': 's0218',
    'travel': 's0550',
}
os.makedirs(OUT, exist_ok=True)
for name, sid in SFX.items():
    shutil.copyfile(f'{D}/{sid}.dat', f'{OUT}/{name.replace(":", "_")}.wav')
    print(name, sid)
print(len(SFX), '->', OUT)
