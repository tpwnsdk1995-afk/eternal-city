# python tools/ec-icons.py -> public/art/icon_<key>.png (64x64, transparent): item icons cut from the original client.
# 03xxx part 1 = equipment preview image; 01xxx/07xxx = small consumable props. Tiny sources are pixel-doubled
# (NEAREST) so they stay crisp; big ones are LANCZOS-fitted. Ammo kinds share the one original ammo box, colorised.
import os, struct, importlib.util
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

# key: (file, layer) - 001xx icon atlases: one rid per file, each layer of its single frame is one icon
ATLAS = {
    'glock17': ('00111', 0),
    'm1911': ('00105', 1),
    'beretta92': ('00123', 30),
    'p226': ('00105', 0),
    'usp45': ('00123', 29),
    'fiveseven': ('00105', 2),
    'desert_eagle': ('00108', 5),
    'python': ('00108', 4),
    'mk23': ('00111', 16),
    'glock18': ('00104', 4),
    'raging_bull': ('00111', 8),
    'sw500': ('00105', 3),
    'uzi': ('00108', 6),
    'mp5': ('00111', 1),
    'mac10': ('00104', 12),
    'ump45': ('00123', 27),
    'p90': ('00111', 4),
    'mp7': ('00111', 15),
    'vector': ('00123', 28),
    'pp19': ('00123', 25),
    'mp5sd': ('00123', 26),
    'scorpion_evo': ('00123', 85),
    'mpx': ('00111', 18),
    'mp9': ('00123', 86),
    'm16a2': ('00111', 5),
    'ak47': ('00111', 2),
    'm4a1': ('00111', 6),
    'g36': ('00111', 14),
    'aug': ('00123', 23),
    'lr300': ('00123', 14),
    'ak74m': ('00123', 13),
    'fn_fal': ('00123', 20),
    'xm8': ('00123', 11),
    'scar_h': ('00123', 17),
    'hk416': ('00123', 19),
    'an94': ('00123', 21),
    'hk417': ('00123', 18),
    'winchester1897': ('00123', 61),
    'rem870': ('00123', 60),
    'mossberg500': ('00108', 10),
    'spas12': ('00123', 62),
    'm1014': ('00123', 63),
    'saiga12': ('00111', 13),
    'striker': ('00111', 11),
    'aa12': ('00111', 10),
    'magnum_blaster': ('00123', 37),
    'ksg': ('00123', 84),
    'usas12': ('00111', 46),
    'mosin': ('00123', 35),
    'm24': ('00111', 12),
    'dragunov': ('00123', 32),
    'psg1': ('00123', 33),
    'l96': ('00111', 23),
    'm40a3': ('00111', 19),
    'sv98': ('00111', 22),
    'm82': ('00111', 20),
    'm95': ('00111', 49),
    'm200': ('00123', 88),
    'as50': ('00111', 47),
    'ntw20': ('00123', 87),
    'm249': ('00111', 17),
    'm60': ('00111', 51),
    'rpk74': ('00123', 24),
    'mg3': ('00111', 52),
    'pkm': ('00123', 15),
    'm240': ('00111', 48),
    'mk48': ('00123', 94),
    'm134': ('00108', 12),
    'xm312': ('00111', 44),
    'wood_bat': ('00108', 0),
    'baton': ('00104', 2),
    'pipe': ('00108', 3),
    'combat_knife': ('00123', 51),
    'machete': ('00104', 7),
    'metal_bat': ('00108', 2),
    'fire_axe': ('00123', 4),
    'sledgehammer': ('00123', 53),
    'katana': ('00108', 8),
    'spear': ('00123', 1),
    'halberd': ('00123', 3),
    'battle_axe': ('00123', 83),
    'war_hammer': ('00123', 48),
    'tactical_sword': ('00123', 5),
    'plasma_blade': ('00123', 36),
    'seoul_halberd': ('00123', 75),
    'm79': ('00111', 9),
    'rpg7': ('00111', 24),
    'law': ('00111', 26),
    'm32': ('00111', 25),
    'at4': ('00123', 49),
    'gm94': ('00111', 45),
    'smaw': ('00123', 50),
    'xm25': ('00111', 40),
    'javelin': ('00111', 41),
    'claws': ('00122', 86),
    'fangs': ('00122', 84),
    'tentacle': ('00123', 73),
    'spine_whip': ('00123', 72),
    'acid_spit': ('00122', 85),
    'bile_bomb': ('00122', 90),
    'bone_blade': ('00123', 77),
    'carapace_fist': ('00122', 87),
    'venom_stinger': ('00123', 74),
    'bone_scythe': ('00123', 76),
    'horror_maw': ('00122', 89),
    'plague_spit': ('00122', 91),
    'apex_claws': ('00123', 81),
    'phantom_9': ('00111', 50),
    'judgement_50': ('00123', 64),
    'hornet_swarm': ('00123', 6),
    'viper_pdw': ('00104', 63),
    'nightfall_ar': ('00111', 39),
    'berserk_ak': ('00104', 9),
    'hydra_12': ('00111', 43),
    'sunbreaker': ('00123', 55),
    'wraith_dmr': ('00123', 8),
    'railgun_x': ('00123', 58),
    'arc_cannon': ('00123', 57),
    'tempest_mg': ('00104', 52),
    'plasma_mortar': ('00123', 47),
    'hellfire_mlrs': ('00123', 59),
    'photon_chakram': ('00123', 46),
    'executioner_flail': ('00111', 32),
    'frost_axe': ('00123', 92),
    'void_axe': ('00111', 34),
    'crimson_trident': ('00123', 93),
    'moonlight_sword': ('00104', 8),
    'sky_spear': ('00123', 91),
    'guillotine_axe': ('00123', 82),
    'armor_top_tshirt': ('00106', 12),
    'armor_top_basic': ('00106', 1),
    'armor_top_hoodie': ('00106', 27),
    'armor_top_camo': ('00106', 2),
    'armor_top_police': ('00106', 67),
    'armor_top_riot': ('00105', 6),
    'armor_top_tactical': ('00106', 73),
    'armor_top_tactical_cl': ('00106', 85),
    'armor_top_swat': ('00105', 7),
    'armor_top_swat_cl': ('00105', 59),
    'armor_top_hunter': ('00105', 25),
    'armor_top_hunter_cl': ('00106', 76),
    'armor_top_gangnam': ('00106', 78),
    'armor_top_gangnam_cl': ('00105', 26),
    'armor_top_wito': ('00105', 19),
    'armor_top_wito_cl': ('00106', 74),
    'armor_top_seoul': ('00106', 75),
    'armor_top_seoul_cl': ('00105', 22),
    'armor_bottom_jeans': ('00106', 25),
    'armor_bottom_basic': ('00106', 0),
    'armor_bottom_camo': ('00106', 29),
    'armor_bottom_police': ('00106', 28),
    'armor_bottom_riot': ('00105', 48),
    'armor_bottom_tactical': ('00106', 50),
    'armor_bottom_swat': ('00105', 49),
    'armor_bottom_hunter': ('00106', 68),
    'armor_bottom_gangnam': ('00105', 32),
    'armor_bottom_wito': ('00105', 13),
    'armor_bottom_seoul': ('00105', 21),
    'armor_coat_trench': ('00106', 84),
    'armor_coat_military': ('00106', 96),
    'armor_coat_leather': ('00106', 83),
    'armor_coat_riot': ('00105', 29),
    'armor_coat_kevlar': ('00106', 87),
    'armor_coat_kevlar_cl': ('00105', 30),
    'armor_coat_swat': ('00105', 62),
    'armor_coat_swat_cl': ('00106', 91),
    'armor_coat_hunter': ('00105', 60),
    'armor_coat_hunter_cl': ('00105', 61),
    'armor_coat_gangnam': ('00106', 93),
    'armor_coat_gangnam_cl': ('00106', 88),
    'armor_coat_wito': ('00105', 27),
    'armor_coat_wito_cl': ('00106', 89),
    'armor_coat_seoul': ('00105', 28),
    'armor_coat_seoul_cl': ('00105', 31),
    'armor_shoes_sneakers': ('00106', 46),
    'armor_shoes_running': ('00106', 45),
    'armor_shoes_boots': ('00106', 44),
    'armor_shoes_combat_high': ('00105', 51),
    'armor_shoes_tactical': ('00106', 58),
    'armor_shoes_swat': ('00105', 53),
    'armor_shoes_hunter': ('00105', 52),
    'armor_shoes_gangnam': ('00105', 54),
    'armor_shoes_wito': ('00105', 50),
    'armor_shoes_seoul': ('00105', 70),
    'armor_hat_cap': ('00106', 39),
    'armor_hat_beret': ('00105', 5),
    'armor_hat_bike': ('00105', 16),
    'armor_hat_helmet': ('00106', 64),
    'armor_hat_police': ('00106', 103),
    'armor_hat_tactical': ('00105', 44),
    'armor_hat_swat': ('00105', 34),
    'armor_hat_hunter': ('00105', 47),
    'armor_hat_gangnam': ('00105', 24),
    'armor_hat_wito': ('00106', 72),
    'armor_hat_seoul': ('00106', 71),
    'armor_hat_straw': ('00106', 37),
    'armor_hat_cowboy': ('00122', 35),
    'armor_hat_sunglasses': ('00108', 32),
    'armor_hat_goggles': ('00105', 40),
    'armor_hat_pumpkin': ('00105', 71),
    'armor_hat_santa': ('00104', 69),
    'armor_wig_short': ('00106', 35),
    'armor_wig_long': ('00106', 31),
    'armor_wig_blonde': ('00106', 34),
    'armor_wig_red': ('00106', 36),
    'armor_wig_ponytail': ('00106', 33),
    'armor_wig_silver': ('00106', 49),
    'armor_wig_braid': ('00106', 48),
    'cola': ('00107', 3),
    'coffee': ('00107', 0),
    'milk': ('00107', 12),
    'energy_drink': ('00107', 4),
    'kimbap': ('00107', 11),
    'sandwich': ('00107', 10),
    'tteokbokki': ('00107', 14),
    'burger': ('00107', 2),
    'beer': ('00107', 6),
    'pizza': ('00107', 13),
    'chicken': ('00107', 1),
    'bandage': ('00107', 25),
    'painkiller': ('00107', 24),
    'gauze': ('00107', 26),
    'vitamin': ('00107', 35),
    'first_aid_kit': ('00107', 21),
    'hp_pill_s': ('00107', 19),
    'hp_pill_m': ('00107', 20),
    'hp_pill_l': ('00107', 27),
    'stamina_pill': ('00107', 34),
    'hp_pack': ('00107', 23),
    'hp_pack_xl': ('00107', 36),
    'stamina_pack': ('00107', 5),
    'full_recovery': ('00109', 59),
    'steroid_shot': ('00105', 4),
    'focus_lens': ('00109', 19),
    'def_shot': ('00109', 21),
    'speed_shot': ('00109', 23),
    'crit_shot': ('00105', 76),
    'ampoule': ('00109', 25),
    'ampoule_xl': ('00109', 27),
    'won_coupon': ('00109', 40),
    'weight_sticker': ('00109', 12),
    'enhance_ticket': ('00109', 0),
    'enhance_ticket_premium': ('00109', 3),
    'pabang_clip': ('00109', 14),
    'premium_coupon': ('00109', 2),
    'ammo_normal': ('00104', 83),
    'ammo_incendiary': ('00104', 85),
    'ammo_ap': ('00104', 92),
    'ammo_shell': ('00104', 105),
    'ammo_slug': ('00104', 152),
    'ammo_grenade': ('00104', 86),
    'ammo_rocket': ('00104', 128),
}


def layer(file, rid, part):
    blob = ex.load_blob(f'{D}/{file}.dat', rid); pb, parts = ex.parts_of(blob)
    return ex.layers_of(blob, pb, parts[part][0][0])[0][0]


def atlas_layer(file, idx):
    b = open(f'{D}/{file}.dat', 'rb').read(); rid = struct.unpack_from('<I', b, 3)[0]
    blob = ex.load_blob(f'{D}/{file}.dat', rid); pb, parts = ex.parts_of(blob)
    return ex.layers_of(blob, pb, parts[0][0][0])[idx][0]


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
for key, (f, idx) in ATLAS.items():
    fit(atlas_layer(f, idx)).save(f'{OUT}/icon_{key}.png'); print(key, f, idx)
