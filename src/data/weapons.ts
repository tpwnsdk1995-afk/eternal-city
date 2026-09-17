import type { WeaponDef } from './schema/item';
import { TEX } from './textureKeys';

type In = Omit<WeaponDef, 'kind' | 'tex' | 'iconTex'>;
/** every weapon's icon is `icon_<id>` (original-client art via tools/ec-icons.py) */
const W = (w: In): WeaponDef => {
  const icon = TEX[`icon_${w.id}` as keyof typeof TEX];
  return { kind: 'weapon', tex: icon, iconTex: icon, ...w };
};
const ARC = (speed: number, aoeRadius: number, arc = true) => ({ speed, aoeRadius, arc });

/**
 * Real-firearm roster following the original's classes; one ladder of level tiers per class up to the
 * Lv.85 서울 특무 gear, then the illegal endgame tier above it. `baseDamage` is per shot (shotguns: total across pellets).
 */
export const WEAPONS: WeaponDef[] = [
  // ---------------------------------------------------------------- 권총
  W({ id: 'glock17', name: 'Glock 17', class: '권총', caliber: '9mm', baseDamage: 12, rpm: 240, range: 420, spreadDeg: 2.5, baseAccuracy: 0.85, weightKg: 0.9, reqLevel: 1, price: 8_000 }),
  W({ id: 'm1911', name: 'Colt M1911', class: '권총', caliber: '.45ACP', baseDamage: 17, rpm: 180, range: 400, spreadDeg: 3, baseAccuracy: 0.82, weightKg: 1.1, reqLevel: 3, price: 12_000 }),
  W({ id: 'beretta92', name: 'Beretta 92FS', class: '권총', caliber: '9mm', baseDamage: 14, rpm: 250, range: 430, spreadDeg: 2.4, baseAccuracy: 0.86, weightKg: 0.95, reqLevel: 6, price: 16_000 }),
  W({ id: 'p226', name: 'SIG P226', class: '권총', caliber: '9mm', baseDamage: 17, rpm: 260, range: 440, spreadDeg: 2.2, baseAccuracy: 0.87, weightKg: 0.9, reqLevel: 10, price: 24_000 }),
  W({ id: 'usp45', name: 'H&K USP .45', class: '권총', caliber: '.45ACP', baseDamage: 24, rpm: 200, range: 420, spreadDeg: 2.6, baseAccuracy: 0.85, weightKg: 1.0, reqLevel: 14, price: 36_000 }),
  W({ id: 'fiveseven', name: 'FN Five-seveN', class: '권총', caliber: '9mm', baseDamage: 22, rpm: 300, range: 460, spreadDeg: 2, baseAccuracy: 0.88, weightKg: 0.75, reqLevel: 20, price: 58_000 }),
  W({ id: 'desert_eagle', name: 'Desert Eagle', class: '권총', caliber: '.45ACP', baseDamage: 40, rpm: 120, range: 440, spreadDeg: 3.2, baseAccuracy: 0.82, weightKg: 2.0, reqLevel: 28, price: 110_000 }),
  W({ id: 'python', name: 'Colt Python', class: '권총', caliber: '.45ACP', baseDamage: 48, rpm: 100, range: 460, spreadDeg: 2.4, baseAccuracy: 0.9, weightKg: 1.2, reqLevel: 36, price: 180_000 }),
  W({ id: 'mk23', name: 'H&K Mk23 SOCOM', class: '권총', caliber: '.45ACP', baseDamage: 56, rpm: 180, range: 460, spreadDeg: 2.2, baseAccuracy: 0.88, weightKg: 1.4, reqLevel: 45, price: 320_000 }),
  W({ id: 'glock18', name: 'Glock 18C', class: '권총', caliber: '9mm', baseDamage: 44, rpm: 700, range: 380, spreadDeg: 6, baseAccuracy: 0.7, weightKg: 1.0, reqLevel: 55, price: 620_000 }),
  W({ id: 'raging_bull', name: 'Taurus Raging Bull', class: '권총', caliber: '.45ACP', baseDamage: 96, rpm: 90, range: 480, spreadDeg: 2.6, baseAccuracy: 0.88, weightKg: 1.6, reqLevel: 70, price: 1_500_000 }),
  W({ id: 'sw500', name: 'S&W 500 특무형', class: '권총', caliber: '.45ACP', baseDamage: 150, rpm: 70, range: 500, spreadDeg: 2.4, baseAccuracy: 0.9, weightKg: 2.1, reqLevel: 85, price: 4_000_000 }),
  // ---------------------------------------------------------------- 기관단총
  W({ id: 'uzi', name: 'IMI UZI', class: '기관단총', caliber: '9mm', baseDamage: 8, rpm: 700, range: 340, spreadDeg: 6, baseAccuracy: 0.65, weightKg: 3.2, reqLevel: 4, price: 28_000 }),
  W({ id: 'mp5', name: 'H&K MP5', class: '기관단총', caliber: '9mm', baseDamage: 9, rpm: 600, range: 380, spreadDeg: 4.5, baseAccuracy: 0.72, weightKg: 2.9, reqLevel: 5, price: 35_000 }),
  W({ id: 'mac10', name: 'Ingram MAC-10', class: '기관단총', caliber: '.45ACP', baseDamage: 12, rpm: 900, range: 300, spreadDeg: 7, baseAccuracy: 0.6, weightKg: 2.8, reqLevel: 8, price: 38_000 }),
  W({ id: 'ump45', name: 'H&K UMP45', class: '기관단총', caliber: '.45ACP', baseDamage: 16, rpm: 600, range: 380, spreadDeg: 4.2, baseAccuracy: 0.74, weightKg: 2.5, reqLevel: 12, price: 60_000 }),
  W({ id: 'p90', name: 'FN P90', class: '기관단총', caliber: '9mm', baseDamage: 15, rpm: 900, range: 400, spreadDeg: 4, baseAccuracy: 0.75, weightKg: 2.6, reqLevel: 18, price: 90_000 }),
  W({ id: 'mp7', name: 'H&K MP7', class: '기관단총', caliber: '9mm', baseDamage: 19, rpm: 950, range: 400, spreadDeg: 3.8, baseAccuracy: 0.78, weightKg: 1.9, reqLevel: 24, price: 140_000 }),
  W({ id: 'vector', name: 'KRISS Vector', class: '기관단총', caliber: '.45ACP', baseDamage: 26, rpm: 1100, range: 380, spreadDeg: 4, baseAccuracy: 0.76, weightKg: 2.7, reqLevel: 32, price: 220_000 }),
  W({ id: 'pp19', name: 'PP-19 Bizon', class: '기관단총', caliber: '9mm', baseDamage: 31, rpm: 700, range: 400, spreadDeg: 3.8, baseAccuracy: 0.78, weightKg: 2.8, reqLevel: 40, price: 340_000 }),
  W({ id: 'mp5sd', name: 'H&K MP5SD6', class: '기관단총', caliber: '9mm', baseDamage: 36, rpm: 800, range: 420, spreadDeg: 3.4, baseAccuracy: 0.82, weightKg: 3.2, reqLevel: 48, price: 520_000 }),
  W({ id: 'scorpion_evo', name: 'CZ Scorpion EVO 3', class: '기관단총', caliber: '9mm', baseDamage: 44, rpm: 1000, range: 420, spreadDeg: 3.6, baseAccuracy: 0.8, weightKg: 2.6, reqLevel: 55, price: 720_000 }),
  W({ id: 'mpx', name: 'SIG MPX', class: '기관단총', caliber: '9mm', baseDamage: 64, rpm: 900, range: 440, spreadDeg: 3.2, baseAccuracy: 0.82, weightKg: 2.7, reqLevel: 70, price: 1_600_000 }),
  W({ id: 'mp9', name: 'B&T MP9 특무형', class: '기관단총', caliber: '9mm', baseDamage: 96, rpm: 1000, range: 440, spreadDeg: 3, baseAccuracy: 0.84, weightKg: 1.6, reqLevel: 85, price: 4_500_000 }),
  // ---------------------------------------------------------------- 돌격소총
  W({ id: 'm16a2', name: 'M16A2', class: '돌격소총', caliber: '5.56mm', baseDamage: 16, rpm: 700, range: 480, spreadDeg: 3, baseAccuracy: 0.78, weightKg: 3.6, reqLevel: 8, price: 42_000 }),
  W({ id: 'ak47', name: 'AK-47', class: '돌격소총', caliber: '7.62mm', baseDamage: 20, rpm: 600, range: 460, spreadDeg: 4, baseAccuracy: 0.72, weightKg: 4.3, reqLevel: 12, price: 55_000 }),
  W({ id: 'm4a1', name: 'M4A1', class: '돌격소총', caliber: '5.56mm', baseDamage: 22, rpm: 750, range: 480, spreadDeg: 2.8, baseAccuracy: 0.8, weightKg: 3.1, reqLevel: 16, price: 75_000 }),
  W({ id: 'g36', name: 'H&K G36', class: '돌격소총', caliber: '5.56mm', baseDamage: 26, rpm: 750, range: 500, spreadDeg: 2.6, baseAccuracy: 0.82, weightKg: 3.6, reqLevel: 20, price: 100_000 }),
  W({ id: 'aug', name: 'Steyr AUG', class: '돌격소총', caliber: '5.56mm', baseDamage: 30, rpm: 700, range: 520, spreadDeg: 2.4, baseAccuracy: 0.84, weightKg: 3.6, reqLevel: 25, price: 140_000 }),
  W({ id: 'lr300', name: 'LR-300ML', class: '돌격소총', caliber: '5.56mm', baseDamage: 35, rpm: 750, range: 500, spreadDeg: 2.6, baseAccuracy: 0.82, weightKg: 3.2, reqLevel: 30, price: 190_000 }),
  W({ id: 'ak74m', name: 'AK-74M', class: '돌격소총', caliber: '5.56mm', baseDamage: 40, rpm: 650, range: 500, spreadDeg: 3, baseAccuracy: 0.78, weightKg: 3.4, reqLevel: 34, price: 230_000 }),
  W({ id: 'fn_fal', name: 'FN FAL', class: '돌격소총', caliber: '7.62mm', baseDamage: 52, rpm: 600, range: 520, spreadDeg: 3.2, baseAccuracy: 0.76, weightKg: 4.3, reqLevel: 38, price: 300_000 }),
  W({ id: 'xm8', name: 'H&K XM8', class: '돌격소총', caliber: '5.56mm', baseDamage: 58, rpm: 800, range: 520, spreadDeg: 2.4, baseAccuracy: 0.84, weightKg: 2.8, reqLevel: 45, price: 420_000 }),
  W({ id: 'scar_h', name: 'FN SCAR-H', class: '돌격소총', caliber: '7.62mm', baseDamage: 74, rpm: 600, range: 540, spreadDeg: 2.6, baseAccuracy: 0.82, weightKg: 3.6, reqLevel: 55, price: 820_000 }),
  W({ id: 'hk416', name: 'H&K HK416', class: '돌격소총', caliber: '5.56mm', baseDamage: 88, rpm: 850, range: 540, spreadDeg: 2.2, baseAccuracy: 0.85, weightKg: 3.5, reqLevel: 65, price: 1_400_000 }),
  W({ id: 'an94', name: 'AN-94 아바칸', class: '돌격소총', caliber: '5.56mm', baseDamage: 104, rpm: 900, range: 540, spreadDeg: 2.4, baseAccuracy: 0.84, weightKg: 3.9, reqLevel: 75, price: 2_500_000 }),
  W({ id: 'hk417', name: 'H&K HK417 특무형', class: '돌격소총', caliber: '7.62mm', baseDamage: 150, rpm: 700, range: 560, spreadDeg: 2.2, baseAccuracy: 0.86, weightKg: 4.2, reqLevel: 85, price: 5_000_000 }),
  // ---------------------------------------------------------------- 산탄총 (baseDamage = 8펠릿 합계)
  W({ id: 'winchester1897', name: 'Winchester M1897', class: '산탄총', caliber: '12ga', baseDamage: 56, pellets: 8, rpm: 50, range: 200, spreadDeg: 11, baseAccuracy: 0.78, weightKg: 3.6, reqLevel: 2, price: 20_000 }),
  W({ id: 'rem870', name: 'Remington 870', class: '산탄총', caliber: '12ga', baseDamage: 64, pellets: 8, rpm: 60, range: 220, spreadDeg: 10, baseAccuracy: 0.8, weightKg: 3.6, reqLevel: 6, price: 30_000 }),
  W({ id: 'mossberg500', name: 'Mossberg 500', class: '산탄총', caliber: '12ga', baseDamage: 72, pellets: 8, rpm: 70, range: 230, spreadDeg: 9.5, baseAccuracy: 0.8, weightKg: 3.4, reqLevel: 10, price: 46_000 }),
  W({ id: 'spas12', name: 'Franchi SPAS-12', class: '산탄총', caliber: '12ga', baseDamage: 80, pellets: 8, rpm: 120, range: 240, spreadDeg: 9, baseAccuracy: 0.8, weightKg: 4.4, reqLevel: 14, price: 70_000 }),
  W({ id: 'm1014', name: 'Benelli M1014', class: '산탄총', caliber: '12ga', baseDamage: 96, pellets: 8, rpm: 130, range: 250, spreadDeg: 8.5, baseAccuracy: 0.82, weightKg: 3.8, reqLevel: 20, price: 110_000 }),
  W({ id: 'saiga12', name: 'Saiga-12', class: '산탄총', caliber: '12ga', baseDamage: 112, pellets: 8, rpm: 180, range: 240, spreadDeg: 9.5, baseAccuracy: 0.76, weightKg: 3.6, reqLevel: 28, price: 180_000 }),
  W({ id: 'striker', name: 'Armsel Striker', class: '산탄총', caliber: '12ga', baseDamage: 136, pellets: 8, rpm: 200, range: 240, spreadDeg: 10, baseAccuracy: 0.74, weightKg: 4.2, reqLevel: 36, price: 260_000 }),
  W({ id: 'aa12', name: 'AA-12', class: '산탄총', caliber: '12ga', baseDamage: 160, pellets: 8, rpm: 300, range: 240, spreadDeg: 10, baseAccuracy: 0.72, weightKg: 4.8, reqLevel: 45, price: 420_000 }),
  W({ id: 'magnum_blaster', name: 'Magnum Blaster', class: '산탄총', caliber: '12ga', baseDamage: 200, pellets: 8, rpm: 240, range: 260, spreadDeg: 8.5, baseAccuracy: 0.8, weightKg: 4.6, reqLevel: 55, price: 820_000 }),
  W({ id: 'ksg', name: 'Kel-Tec KSG', class: '산탄총', caliber: '12ga', baseDamage: 272, pellets: 8, rpm: 120, range: 260, spreadDeg: 8, baseAccuracy: 0.82, weightKg: 3.1, reqLevel: 70, price: 1_600_000 }),
  W({ id: 'usas12', name: 'USAS-12 특무형', class: '산탄총', caliber: '12ga', baseDamage: 384, pellets: 8, rpm: 300, range: 260, spreadDeg: 9, baseAccuracy: 0.8, weightKg: 5.5, reqLevel: 85, price: 5_000_000 }),
  // ---------------------------------------------------------------- 저격소총
  W({ id: 'mosin', name: 'Mosin-Nagant M91/30', class: '저격소총', caliber: '7.62mm', baseDamage: 80, rpm: 35, range: 700, spreadDeg: 0.8, baseAccuracy: 0.9, weightKg: 4.0, reqLevel: 6, price: 40_000 }),
  W({ id: 'm24', name: 'M24 SWS', class: '저격소총', caliber: '7.62mm', baseDamage: 110, rpm: 40, range: 800, spreadDeg: 0.5, baseAccuracy: 0.95, weightKg: 5.5, reqLevel: 10, reqTechGrade: 2, price: 65_000 }),
  W({ id: 'dragunov', name: 'SVD Dragunov', class: '저격소총', caliber: '7.62mm', baseDamage: 90, rpm: 70, range: 760, spreadDeg: 1, baseAccuracy: 0.9, weightKg: 4.7, reqLevel: 16, reqTechGrade: 2, price: 90_000 }),
  W({ id: 'psg1', name: 'H&K PSG-1', class: '저격소총', caliber: '7.62mm', baseDamage: 130, rpm: 90, range: 780, spreadDeg: 0.8, baseAccuracy: 0.93, weightKg: 7.2, reqLevel: 20, reqTechGrade: 2, price: 130_000 }),
  W({ id: 'm82', name: 'Barrett M82', class: '저격소총', caliber: '.50BMG', baseDamage: 220, rpm: 30, range: 900, spreadDeg: 0.6, baseAccuracy: 0.93, weightKg: 14, reqLevel: 24, reqTechGrade: 3, price: 180_000 }),
  W({ id: 'l96', name: 'AI L96A1 (AWM)', class: '저격소총', caliber: '7.62mm', baseDamage: 230, rpm: 45, range: 860, spreadDeg: 0.4, baseAccuracy: 0.96, weightKg: 6.5, reqLevel: 30, reqTechGrade: 3, price: 240_000 }),
  W({ id: 'm40a3', name: 'M40A3', class: '저격소총', caliber: '7.62mm', baseDamage: 280, rpm: 40, range: 880, spreadDeg: 0.4, baseAccuracy: 0.96, weightKg: 7.5, reqLevel: 36, reqTechGrade: 3, price: 320_000 }),
  W({ id: 'sv98', name: 'SV-98', class: '저격소총', caliber: '7.62mm', baseDamage: 330, rpm: 50, range: 880, spreadDeg: 0.5, baseAccuracy: 0.95, weightKg: 6.2, reqLevel: 42, reqTechGrade: 3, price: 420_000 }),
  W({ id: 'm95', name: 'Barrett M95', class: '저격소총', caliber: '.50BMG', baseDamage: 460, rpm: 30, range: 920, spreadDeg: 0.6, baseAccuracy: 0.94, weightKg: 10.5, reqLevel: 50, reqTechGrade: 4, price: 700_000 }),
  W({ id: 'm200', name: 'CheyTac M200', class: '저격소총', caliber: '.50BMG', baseDamage: 600, rpm: 35, range: 960, spreadDeg: 0.3, baseAccuracy: 0.97, weightKg: 12, reqLevel: 60, reqTechGrade: 4, price: 1_200_000 }),
  W({ id: 'as50', name: 'AI AS50', class: '저격소총', caliber: '.50BMG', baseDamage: 720, rpm: 60, range: 940, spreadDeg: 0.6, baseAccuracy: 0.94, weightKg: 14, reqLevel: 72, reqTechGrade: 4, price: 2_400_000 }),
  W({ id: 'ntw20', name: 'NTW-20 특무형', class: '저격소총', caliber: '.50BMG', baseDamage: 1100, rpm: 20, range: 1000, spreadDeg: 0.4, baseAccuracy: 0.95, weightKg: 26, reqLevel: 85, reqTechGrade: 5, price: 6_000_000 }),
  // ---------------------------------------------------------------- 기관총 (rpm 300 고정)
  W({ id: 'm249', name: 'M249 SAW', class: '기관총', caliber: '5.56mm', baseDamage: 17, rpm: 300, range: 480, spreadDeg: 4.5, baseAccuracy: 0.65, weightKg: 7.5, reqLevel: 15, reqTechGrade: 2, price: 95_000 }),
  W({ id: 'm60', name: 'M60', class: '기관총', caliber: '7.62mm', baseDamage: 22, rpm: 300, range: 500, spreadDeg: 5.5, baseAccuracy: 0.6, weightKg: 10.5, reqLevel: 18, reqTechGrade: 2, price: 120_000 }),
  W({ id: 'rpk74', name: 'RPK-74', class: '기관총', caliber: '5.56mm', baseDamage: 28, rpm: 300, range: 500, spreadDeg: 4.5, baseAccuracy: 0.66, weightKg: 5.5, reqLevel: 22, reqTechGrade: 2, price: 150_000 }),
  W({ id: 'mg3', name: 'MG3', class: '기관총', caliber: '7.62mm', baseDamage: 36, rpm: 300, range: 520, spreadDeg: 5.5, baseAccuracy: 0.62, weightKg: 11.5, reqLevel: 28, reqTechGrade: 2, price: 200_000 }),
  W({ id: 'pkm', name: 'PKM', class: '기관총', caliber: '7.62mm', baseDamage: 46, rpm: 300, range: 520, spreadDeg: 5, baseAccuracy: 0.64, weightKg: 9, reqLevel: 36, reqTechGrade: 3, price: 300_000 }),
  W({ id: 'm240', name: 'M240B', class: '기관총', caliber: '7.62mm', baseDamage: 58, rpm: 300, range: 540, spreadDeg: 4.8, baseAccuracy: 0.66, weightKg: 12, reqLevel: 45, reqTechGrade: 3, price: 450_000 }),
  W({ id: 'mk48', name: 'Mk 48 Mod 1', class: '기관총', caliber: '7.62mm', baseDamage: 76, rpm: 300, range: 540, spreadDeg: 4.5, baseAccuracy: 0.68, weightKg: 8.2, reqLevel: 55, reqTechGrade: 3, price: 850_000 }),
  W({ id: 'm134', name: 'M134 미니건', class: '기관총', caliber: '7.62mm', baseDamage: 100, rpm: 300, range: 500, spreadDeg: 7, baseAccuracy: 0.55, weightKg: 30, reqLevel: 70, reqTechGrade: 4, price: 2_000_000 }),
  W({ id: 'xm312', name: 'XM312 특무형', class: '기관총', caliber: '.50BMG', baseDamage: 180, rpm: 300, range: 560, spreadDeg: 5, baseAccuracy: 0.6, weightKg: 19, reqLevel: 85, reqTechGrade: 5, price: 6_000_000 }),
  // ---------------------------------------------------------------- 근접무기 (원작: 도검·도끼·둔기·장창·미늘창)
  W({ id: 'wood_bat', name: '참나무 야구방망이', class: '근접무기', caliber: 'none', baseDamage: 15, rpm: 100, range: 42, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 0.9, reqLevel: 1, price: 2_000 }),
  W({ id: 'baton', name: '경찰봉', class: '근접무기', caliber: 'none', baseDamage: 18, rpm: 90, range: 40, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 0.6, reqLevel: 1, price: 3_000 }),
  W({ id: 'pipe', name: '쇠파이프', class: '근접무기', caliber: 'none', baseDamage: 24, rpm: 80, range: 44, spreadDeg: 0, baseAccuracy: 0.94, weightKg: 1.8, reqLevel: 3, price: 4_500 }),
  W({ id: 'combat_knife', name: '군용 대검', class: '근접무기', caliber: 'none', baseDamage: 26, rpm: 130, range: 34, spreadDeg: 0, baseAccuracy: 0.96, weightKg: 0.4, reqLevel: 4, price: 8_000 }),
  W({ id: 'machete', name: '마체테', class: '근접무기', caliber: 'none', baseDamage: 30, rpm: 75, range: 44, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 1.1, reqLevel: 5, price: 9_000 }),
  W({ id: 'metal_bat', name: '알루미늄 배트', class: '근접무기', caliber: 'none', baseDamage: 36, rpm: 95, range: 44, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 1.0, reqLevel: 7, price: 12_000 }),
  W({ id: 'fire_axe', name: '소방도끼', class: '근접무기', caliber: 'none', baseDamage: 55, rpm: 45, range: 48, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 3.5, reqLevel: 10, price: 20_000 }),
  W({ id: 'sledgehammer', name: '대형 해머', class: '근접무기', caliber: 'none', baseDamage: 84, rpm: 35, range: 50, spreadDeg: 0, baseAccuracy: 0.93, weightKg: 5.5, reqLevel: 14, price: 35_000 }),
  W({ id: 'katana', name: '일본도', class: '근접무기', caliber: 'none', baseDamage: 80, rpm: 90, range: 52, spreadDeg: 0, baseAccuracy: 0.96, weightKg: 1.3, reqLevel: 18, price: 60_000 }),
  W({ id: 'spear', name: '장창', class: '근접무기', caliber: 'none', baseDamage: 96, rpm: 70, range: 72, spreadDeg: 0, baseAccuracy: 0.94, weightKg: 2.4, reqLevel: 22, price: 80_000 }),
  W({ id: 'halberd', name: '미늘창', class: '근접무기', caliber: 'none', baseDamage: 130, rpm: 50, range: 74, spreadDeg: 0, baseAccuracy: 0.93, weightKg: 4.2, reqLevel: 28, price: 130_000 }),
  W({ id: 'battle_axe', name: '양날 전투도끼', class: '근접무기', caliber: 'none', baseDamage: 190, rpm: 40, range: 52, spreadDeg: 0, baseAccuracy: 0.93, weightKg: 5.0, reqLevel: 35, price: 220_000 }),
  W({ id: 'war_hammer', name: '전투 해머', class: '근접무기', caliber: 'none', baseDamage: 260, rpm: 40, range: 54, spreadDeg: 0, baseAccuracy: 0.93, weightKg: 6.5, reqLevel: 45, price: 400_000 }),
  W({ id: 'tactical_sword', name: '강남 전술도', class: '근접무기', caliber: 'none', baseDamage: 300, rpm: 90, range: 54, spreadDeg: 0, baseAccuracy: 0.96, weightKg: 1.6, reqLevel: 55, price: 820_000 }),
  W({ id: 'plasma_blade', name: '플라즈마 블레이드', class: '근접무기', caliber: 'none', baseDamage: 460, rpm: 100, range: 56, spreadDeg: 0, baseAccuracy: 0.97, weightKg: 1.2, reqLevel: 70, price: 2_000_000 }),
  W({ id: 'seoul_halberd', name: '서울 특무 미늘창', class: '근접무기', caliber: 'none', baseDamage: 700, rpm: 60, range: 76, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 4.0, reqLevel: 85, price: 5_500_000 }),
  // ---------------------------------------------------------------- 투척 · 중화기 (투사체, AoE)
  W({ id: 'm79', name: 'M79 유탄발사기', class: '투척중화기', caliber: 'grenade', baseDamage: 120, rpm: 30, range: 420, spreadDeg: 2, baseAccuracy: 0.9, weightKg: 2.9, reqLevel: 12, reqTechGrade: 2, price: 60_000, projectile: ARC(420, 70) }),
  W({ id: 'rpg7', name: 'RPG-7', class: '투척중화기', caliber: 'rocket', baseDamage: 260, rpm: 15, range: 520, spreadDeg: 1.5, baseAccuracy: 0.9, weightKg: 7, reqLevel: 20, reqTechGrade: 3, price: 150_000, projectile: ARC(520, 90, false) }),
  W({ id: 'law', name: 'M72 LAW', class: '투척중화기', caliber: 'rocket', baseDamage: 340, rpm: 15, range: 500, spreadDeg: 1.6, baseAccuracy: 0.9, weightKg: 2.5, reqLevel: 28, reqTechGrade: 3, price: 200_000, projectile: ARC(540, 90, false) }),
  W({ id: 'm32', name: 'Milkor M32 MGL', class: '투척중화기', caliber: 'grenade', baseDamage: 200, rpm: 90, range: 440, spreadDeg: 2.2, baseAccuracy: 0.88, weightKg: 5.3, reqLevel: 30, reqTechGrade: 3, price: 260_000, projectile: ARC(420, 74) }),
  W({ id: 'at4', name: 'AT4', class: '투척중화기', caliber: 'rocket', baseDamage: 480, rpm: 12, range: 560, spreadDeg: 1.4, baseAccuracy: 0.9, weightKg: 6.7, reqLevel: 35, reqTechGrade: 3, price: 320_000, projectile: ARC(560, 96, false) }),
  W({ id: 'gm94', name: 'GM-94', class: '투척중화기', caliber: 'grenade', baseDamage: 320, rpm: 60, range: 440, spreadDeg: 2, baseAccuracy: 0.9, weightKg: 4.8, reqLevel: 45, reqTechGrade: 3, price: 450_000, projectile: ARC(440, 78) }),
  W({ id: 'smaw', name: 'SMAW', class: '투척중화기', caliber: 'rocket', baseDamage: 800, rpm: 15, range: 580, spreadDeg: 1.2, baseAccuracy: 0.92, weightKg: 7.5, reqLevel: 55, reqTechGrade: 4, price: 900_000, projectile: ARC(580, 100, false) }),
  W({ id: 'xm25', name: 'XM25 CDTE', class: '투척중화기', caliber: 'grenade', baseDamage: 560, rpm: 120, range: 480, spreadDeg: 1.6, baseAccuracy: 0.92, weightKg: 6.3, reqLevel: 70, reqTechGrade: 4, price: 2_000_000, projectile: ARC(460, 80) }),
  W({ id: 'javelin', name: 'FGM-148 재블린 특무형', class: '투척중화기', caliber: 'rocket', baseDamage: 1800, rpm: 10, range: 640, spreadDeg: 1, baseAccuracy: 0.95, weightKg: 22, reqLevel: 85, reqTechGrade: 5, price: 6_000_000, projectile: ARC(600, 120, false) }),
  // ---------------------------------------------------------------- 불법무기 (암거래상) — 최종 티어: 특무형보다 강하고, 하나씩 특이한 버릇이 있다
  W({ id: 'phantom_9', name: 'PHANTOM-9 광자권총', class: '권총', caliber: '9mm', baseDamage: 90, rpm: 900, range: 460, spreadDeg: 3.5, baseAccuracy: 0.85, weightKg: 1.1, reqLevel: 62, illegal: true, price: 3_200_000 }), // 권총인데 기관단총 연사
  W({ id: 'judgement_50', name: '저지먼트 .50 처형 리볼버', class: '권총', caliber: '.45ACP', baseDamage: 480, rpm: 30, range: 520, spreadDeg: 1.8, baseAccuracy: 0.93, weightKg: 2.6, reqLevel: 80, illegal: true, price: 7_500_000 }), // 한 발 480
  W({ id: 'hornet_swarm', name: '호넷 SWARM 초연사기', class: '기관단총', caliber: '9mm', baseDamage: 64, rpm: 2400, range: 420, spreadDeg: 5, baseAccuracy: 0.78, weightKg: 2.2, reqLevel: 65, illegal: true, price: 4_800_000 }), // 분당 2400발
  W({ id: 'viper_pdw', name: '바이퍼 PDW (음속 개조)', class: '기관단총', caliber: '.45ACP', baseDamage: 150, rpm: 1200, range: 460, spreadDeg: 3, baseAccuracy: 0.86, weightKg: 2.4, reqLevel: 82, illegal: true, price: 8_000_000 }),
  W({ id: 'nightfall_ar', name: '나이트폴 광자소총', class: '돌격소총', caliber: '5.56mm', baseDamage: 230, rpm: 850, range: 620, spreadDeg: 2, baseAccuracy: 0.9, weightKg: 3.4, reqLevel: 78, illegal: true, price: 7_500_000 }),
  W({ id: 'berserk_ak', name: '버서크 AK (과열 개조)', class: '돌격소총', caliber: '7.62mm', baseDamage: 140, rpm: 1500, range: 500, spreadDeg: 4.5, baseAccuracy: 0.74, weightKg: 4.6, reqLevel: 68, illegal: true, price: 5_200_000 }), // 소총인데 1500rpm
  W({ id: 'hydra_12', name: '히드라 전자동 산탄총', class: '산탄총', caliber: '12ga', baseDamage: 560, pellets: 8, rpm: 420, range: 250, spreadDeg: 10, baseAccuracy: 0.76, weightKg: 5.8, reqLevel: 66, illegal: true, price: 5_000_000 }), // 산탄총 420rpm
  W({ id: 'sunbreaker', name: '선브레이커 광자산탄총', class: '산탄총', caliber: '12ga', baseDamage: 1080, pellets: 12, rpm: 90, range: 300, spreadDeg: 8, baseAccuracy: 0.84, weightKg: 5.2, reqLevel: 76, illegal: true, price: 6_800_000 }), // 12펠릿
  W({ id: 'wraith_dmr', name: '레이스 DMR (연사 개조)', class: '저격소총', caliber: '7.62mm', baseDamage: 640, rpm: 240, range: 880, spreadDeg: 0.6, baseAccuracy: 0.94, weightKg: 6, reqLevel: 72, reqTechGrade: 4, illegal: true, price: 6_000_000 }), // 저격총 240rpm
  W({ id: 'railgun_x', name: '레일건 X-0 시제품', class: '저격소총', caliber: '.50BMG', baseDamage: 3600, rpm: 12, range: 1100, spreadDeg: 0.2, baseAccuracy: 0.98, weightKg: 24, reqLevel: 85, reqTechGrade: 5, illegal: true, price: 11_000_000 }), // 한 발 3600
  W({ id: 'arc_cannon', name: '아크 캐논 (전자기 개조)', class: '기관총', caliber: '.50BMG', baseDamage: 420, rpm: 300, range: 580, spreadDeg: 4.5, baseAccuracy: 0.66, weightKg: 22, reqLevel: 74, reqTechGrade: 4, illegal: true, price: 6_500_000 }),
  W({ id: 'tempest_mg', name: '템페스트 회전기관총', class: '기관총', caliber: '7.62mm', baseDamage: 160, rpm: 1800, range: 540, spreadDeg: 6, baseAccuracy: 0.6, weightKg: 34, reqLevel: 82, reqTechGrade: 5, illegal: true, price: 9_500_000 }), // 기관총 300rpm 규칙을 깨는 1800rpm
  W({ id: 'plasma_mortar', name: '플라즈마 박격포', class: '투척중화기', caliber: 'grenade', baseDamage: 1500, rpm: 60, range: 500, spreadDeg: 1.5, baseAccuracy: 0.92, weightKg: 9, reqLevel: 75, reqTechGrade: 4, illegal: true, price: 8_000_000, projectile: ARC(460, 140) }), // 폭발 반경 140
  W({ id: 'hellfire_mlrs', name: '헬파이어 다연장 로켓', class: '투척중화기', caliber: 'rocket', baseDamage: 2800, rpm: 40, range: 660, spreadDeg: 1.2, baseAccuracy: 0.94, weightKg: 26, reqLevel: 84, reqTechGrade: 5, illegal: true, price: 12_000_000, projectile: ARC(640, 130, false) }),
  W({ id: 'photon_chakram', name: '광자 차크람', class: '근접무기', caliber: 'none', baseDamage: 520, rpm: 300, range: 52, spreadDeg: 0, baseAccuracy: 0.97, weightKg: 0.8, reqLevel: 64, illegal: true, price: 4_600_000 }), // 근접 300rpm
  W({ id: 'executioner_flail', name: '처형자의 쇠사슬 철퇴', class: '근접무기', caliber: 'none', baseDamage: 1500, rpm: 30, range: 92, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 9, reqLevel: 68, illegal: true, price: 5_200_000 }), // 한 방 1500
  W({ id: 'frost_axe', name: '빙정 도끼', class: '근접무기', caliber: 'none', baseDamage: 900, rpm: 90, range: 58, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 4, reqLevel: 70, illegal: true, price: 5_600_000 }),
  W({ id: 'void_axe', name: '보이드 쌍날 대부', class: '근접무기', caliber: 'none', baseDamage: 1200, rpm: 50, range: 62, spreadDeg: 0, baseAccuracy: 0.93, weightKg: 7, reqLevel: 74, illegal: true, price: 6_200_000 }),
  W({ id: 'crimson_trident', name: '진홍 삼지창', class: '근접무기', caliber: 'none', baseDamage: 1100, rpm: 70, range: 120, spreadDeg: 0, baseAccuracy: 0.94, weightKg: 4.5, reqLevel: 78, illegal: true, price: 7_000_000 }), // 근접인데 사거리 120
  W({ id: 'moonlight_sword', name: '월광검', class: '근접무기', caliber: 'none', baseDamage: 1300, rpm: 130, range: 60, spreadDeg: 0, baseAccuracy: 0.97, weightKg: 1.5, reqLevel: 82, illegal: true, price: 8_500_000 }),
  W({ id: 'sky_spear', name: '천공의 황금창', class: '근접무기', caliber: 'none', baseDamage: 1800, rpm: 60, range: 100, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 5, reqLevel: 86, illegal: true, price: 10_000_000 }),
  W({ id: 'guillotine_axe', name: '단두 대부월', class: '근접무기', caliber: 'none', baseDamage: 2600, rpm: 22, range: 64, spreadDeg: 0, baseAccuracy: 0.93, weightKg: 12, reqLevel: 90, illegal: true, price: 13_000_000 }), // 한 방 2600, 느림
  // ---------------------------------------------------------------- 변이무기 (감염체 전용)
  W({ id: 'claws', name: '발톱', class: '변이무기', caliber: 'none', baseDamage: 16, rpm: 150, range: 42, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 0, reqLevel: 1, race: 'infected', price: 2_500 }),
  W({ id: 'fangs', name: '송곳니', class: '변이무기', caliber: 'none', baseDamage: 26, rpm: 130, range: 40, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 0, reqLevel: 4, race: 'infected', price: 7_000 }),
  W({ id: 'tentacle', name: '촉수', class: '변이무기', caliber: 'none', baseDamage: 44, rpm: 60, range: 96, spreadDeg: 0, baseAccuracy: 0.9, weightKg: 0, reqLevel: 8, race: 'infected', price: 18_000 }),
  W({ id: 'spine_whip', name: '척추 채찍', class: '변이무기', caliber: 'none', baseDamage: 60, rpm: 70, range: 110, spreadDeg: 0, baseAccuracy: 0.9, weightKg: 0, reqLevel: 12, race: 'infected', price: 30_000 }),
  W({ id: 'acid_spit', name: '산성 토사', class: '변이무기', caliber: 'none', baseDamage: 58, rpm: 40, range: 320, spreadDeg: 2, baseAccuracy: 0.88, weightKg: 0, reqLevel: 15, race: 'infected', price: 45_000, projectile: { speed: 380, aoeRadius: 52, arc: true, selfDamage: false } }),
  W({ id: 'bile_bomb', name: '담즙 폭탄', class: '변이무기', caliber: 'none', baseDamage: 100, rpm: 30, range: 340, spreadDeg: 2, baseAccuracy: 0.88, weightKg: 0, reqLevel: 20, race: 'infected', price: 70_000, projectile: { speed: 380, aoeRadius: 64, arc: true, selfDamage: false } }),
  W({ id: 'bone_blade', name: '골검', class: '변이무기', caliber: 'none', baseDamage: 92, rpm: 80, range: 58, spreadDeg: 0, baseAccuracy: 0.9, weightKg: 0, reqLevel: 25, race: 'infected', price: 120_000 }),
  W({ id: 'carapace_fist', name: '갑각 주먹', class: '변이무기', caliber: 'none', baseDamage: 150, rpm: 100, range: 46, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 0, reqLevel: 32, race: 'infected', price: 180_000 }),
  W({ id: 'venom_stinger', name: '독침', class: '변이무기', caliber: 'none', baseDamage: 180, rpm: 60, range: 380, spreadDeg: 1.5, baseAccuracy: 0.9, weightKg: 0, reqLevel: 40, race: 'infected', price: 300_000, projectile: { speed: 440, aoeRadius: 30, arc: false, selfDamage: false } }),
  W({ id: 'bone_scythe', name: '골낫', class: '변이무기', caliber: 'none', baseDamage: 280, rpm: 60, range: 72, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 0, reqLevel: 50, race: 'infected', price: 600_000 }),
  W({ id: 'horror_maw', name: '괴물 아가리', class: '변이무기', caliber: 'none', baseDamage: 380, rpm: 80, range: 50, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 0, reqLevel: 62, race: 'infected', price: 1_200_000 }),
  W({ id: 'plague_spit', name: '역병 토사', class: '변이무기', caliber: 'none', baseDamage: 500, rpm: 40, range: 360, spreadDeg: 2, baseAccuracy: 0.9, weightKg: 0, reqLevel: 72, race: 'infected', price: 2_200_000, projectile: { speed: 400, aoeRadius: 80, arc: true, selfDamage: false } }),
  W({ id: 'apex_claws', name: '정점 발톱', class: '변이무기', caliber: 'none', baseDamage: 740, rpm: 140, range: 48, spreadDeg: 0, baseAccuracy: 0.94, weightKg: 0, reqLevel: 85, race: 'infected', price: 5_500_000 }),
];
