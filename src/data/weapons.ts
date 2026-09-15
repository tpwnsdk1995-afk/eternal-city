import type { WeaponDef } from './schema/item';
import { TEX } from './textureKeys';

const W = (w: Omit<WeaponDef, 'kind' | 'gradeMin' | 'gradeMax'> & Partial<Pick<WeaponDef, 'gradeMin' | 'gradeMax'>>): WeaponDef => ({ kind: 'weapon', gradeMin: 1, gradeMax: 11, ...w });

/**
 * Real-firearm roster. `baseDamage` is per shot at grade 1 (shotguns: total across pellets);
 * every grade multiplies by 1.25. `price` is grade 1.
 */
export const WEAPONS: WeaponDef[] = [
  // ---------------------------------------------------------------- 권총
  W({ id: 'glock17', name: 'Glock 17', class: '권총', caliber: '9mm', baseDamage: 12, rpm: 240, range: 420, spreadDeg: 3, baseAccuracy: 0.85, weightKg: 0.9, reqLevel: 1, price: 8_000, tex: TEX.icon_glock17, iconTex: TEX.icon_glock17 }),
  W({ id: 'm1911', name: 'Colt M1911', class: '권총', caliber: '.45ACP', baseDamage: 17, rpm: 180, range: 400, spreadDeg: 3.5, baseAccuracy: 0.82, weightKg: 1.1, reqLevel: 3, price: 12_000, tex: TEX.icon_m1911, iconTex: TEX.icon_m1911 }),
  // ---------------------------------------------------------------- 기관단총
  W({ id: 'mp5', name: 'H&K MP5', class: '기관단총', caliber: '9mm', baseDamage: 9, rpm: 600, range: 380, spreadDeg: 6, baseAccuracy: 0.72, weightKg: 2.9, reqLevel: 5, price: 35_000, tex: TEX.icon_mp5, iconTex: TEX.icon_mp5 }),
  W({ id: 'uzi', name: 'IMI UZI', class: '기관단총', caliber: '9mm', baseDamage: 8, rpm: 700, range: 340, spreadDeg: 8, baseAccuracy: 0.65, weightKg: 3.2, reqLevel: 4, price: 28_000, tex: TEX.icon_uzi, iconTex: TEX.icon_uzi }),
  // ---------------------------------------------------------------- 돌격소총
  W({ id: 'm16a2', name: 'M16A2', class: '돌격소총', caliber: '5.56mm', baseDamage: 16, rpm: 700, range: 480, spreadDeg: 4, baseAccuracy: 0.78, weightKg: 3.6, reqLevel: 8, price: 42_000, tex: TEX.icon_m16, iconTex: TEX.icon_m16 }),
  W({ id: 'ak47', name: 'AK-47', class: '돌격소총', caliber: '7.62mm', baseDamage: 20, rpm: 600, range: 460, spreadDeg: 5.5, baseAccuracy: 0.72, weightKg: 4.3, reqLevel: 12, price: 55_000, tex: TEX.icon_ak47, iconTex: TEX.icon_ak47 }),
  // ---------------------------------------------------------------- 산탄총 (baseDamage = 8펠릿 합계)
  W({ id: 'rem870', name: 'Remington 870', class: '산탄총', caliber: '12ga', baseDamage: 64, pellets: 8, rpm: 60, range: 220, spreadDeg: 10, baseAccuracy: 0.8, weightKg: 3.6, reqLevel: 6, price: 30_000, tex: TEX.icon_shotgun, iconTex: TEX.icon_shotgun }),
  W({ id: 'spas12', name: 'Franchi SPAS-12', class: '산탄총', caliber: '12ga', baseDamage: 72, pellets: 8, rpm: 120, range: 240, spreadDeg: 9, baseAccuracy: 0.8, weightKg: 4.4, reqLevel: 14, price: 70_000, tex: TEX.icon_shotgun, iconTex: TEX.icon_shotgun }),
  // ---------------------------------------------------------------- 저격소총
  W({ id: 'm24', name: 'M24 SWS', class: '저격소총', caliber: '7.62mm', baseDamage: 110, rpm: 40, range: 800, spreadDeg: 0.5, baseAccuracy: 0.95, weightKg: 5.5, reqLevel: 10, reqTechGrade: 2, price: 65_000, tex: TEX.icon_sniper, iconTex: TEX.icon_sniper }),
  W({ id: 'dragunov', name: 'SVD Dragunov', class: '저격소총', caliber: '7.62mm', baseDamage: 90, rpm: 70, range: 760, spreadDeg: 1, baseAccuracy: 0.9, weightKg: 4.7, reqLevel: 16, reqTechGrade: 2, price: 90_000, tex: TEX.icon_sniper, iconTex: TEX.icon_sniper }),
  W({ id: 'm82', name: 'Barrett M82', class: '저격소총', caliber: '.50BMG', baseDamage: 220, rpm: 30, range: 900, spreadDeg: 0.6, baseAccuracy: 0.93, weightKg: 14, reqLevel: 24, reqTechGrade: 3, price: 180_000, tex: TEX.icon_sniper, iconTex: TEX.icon_sniper }),
  // ---------------------------------------------------------------- 기관총 (rpm 300 고정)
  W({ id: 'm249', name: 'M249 SAW', class: '기관총', caliber: '5.56mm', baseDamage: 17, rpm: 300, range: 480, spreadDeg: 6, baseAccuracy: 0.65, weightKg: 7.5, reqLevel: 15, reqTechGrade: 2, price: 95_000, tex: TEX.icon_mg, iconTex: TEX.icon_mg }),
  W({ id: 'm60', name: 'M60', class: '기관총', caliber: '7.62mm', baseDamage: 22, rpm: 300, range: 500, spreadDeg: 7, baseAccuracy: 0.6, weightKg: 10.5, reqLevel: 18, reqTechGrade: 2, price: 120_000, tex: TEX.icon_mg, iconTex: TEX.icon_mg }),
  // ---------------------------------------------------------------- 근접무기
  W({ id: 'baton', name: '경찰봉', class: '근접무기', caliber: 'none', baseDamage: 18, rpm: 90, range: 40, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 0.6, reqLevel: 1, price: 3_000, tex: TEX.icon_baton, iconTex: TEX.icon_baton }),
  W({ id: 'machete', name: '마체테', class: '근접무기', caliber: 'none', baseDamage: 30, rpm: 75, range: 44, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 1.1, reqLevel: 5, price: 9_000, tex: TEX.icon_machete, iconTex: TEX.icon_machete }),
  W({ id: 'fire_axe', name: '소방도끼', class: '근접무기', caliber: 'none', baseDamage: 55, rpm: 45, range: 48, spreadDeg: 0, baseAccuracy: 0.95, weightKg: 3.5, reqLevel: 10, price: 20_000, tex: TEX.icon_axe, iconTex: TEX.icon_axe }),
  // ---------------------------------------------------------------- 투척 · 중화기 (투사체, AoE)
  W({ id: 'm79', name: 'M79 유탄발사기', class: '투척중화기', caliber: 'grenade', baseDamage: 120, rpm: 30, range: 420, spreadDeg: 2, baseAccuracy: 0.9, weightKg: 2.9, reqLevel: 12, reqTechGrade: 2, price: 60_000, projectile: { speed: 420, aoeRadius: 70, arc: true }, tex: TEX.icon_launcher, iconTex: TEX.icon_launcher }),
  W({ id: 'rpg7', name: 'RPG-7', class: '투척중화기', caliber: 'rocket', baseDamage: 260, rpm: 15, range: 520, spreadDeg: 1.5, baseAccuracy: 0.9, weightKg: 7, reqLevel: 20, reqTechGrade: 3, price: 150_000, projectile: { speed: 520, aoeRadius: 90, arc: false }, tex: TEX.icon_launcher, iconTex: TEX.icon_launcher }),
  // ---------------------------------------------------------------- 불법무기 (암거래상)
  W({ id: 'tec9', name: 'TEC-9 (개조)', class: '기관단총', caliber: '9mm', baseDamage: 11, rpm: 900, range: 300, spreadDeg: 11, baseAccuracy: 0.55, weightKg: 1.6, reqLevel: 6, illegal: true, price: 40_000, tex: TEX.icon_uzi, iconTex: TEX.icon_uzi }),
  W({ id: 'sawed_off', name: '단축 산탄총', class: '산탄총', caliber: '12ga', baseDamage: 88, pellets: 8, rpm: 70, range: 150, spreadDeg: 16, baseAccuracy: 0.75, weightKg: 2.4, reqLevel: 9, illegal: true, price: 45_000, tex: TEX.icon_shotgun, iconTex: TEX.icon_shotgun }),
  // ---------------------------------------------------------------- 변이무기 (감염체 전용)
  W({ id: 'claws', name: '발톱', class: '변이무기', caliber: 'none', baseDamage: 16, rpm: 150, range: 42, spreadDeg: 0, baseAccuracy: 0.92, weightKg: 0, reqLevel: 1, race: 'infected', price: 2_500, tex: TEX.icon_claws, iconTex: TEX.icon_claws }),
  W({ id: 'tentacle', name: '촉수', class: '변이무기', caliber: 'none', baseDamage: 44, rpm: 60, range: 96, spreadDeg: 0, baseAccuracy: 0.9, weightKg: 0, reqLevel: 8, race: 'infected', price: 18_000, tex: TEX.icon_tentacle, iconTex: TEX.icon_tentacle }),
  W({ id: 'acid_spit', name: '산성 토사', class: '변이무기', caliber: 'none', baseDamage: 58, rpm: 40, range: 320, spreadDeg: 2, baseAccuracy: 0.88, weightKg: 0, reqLevel: 15, race: 'infected', price: 45_000, projectile: { speed: 380, aoeRadius: 52, arc: true, selfDamage: false }, tex: TEX.icon_acid, iconTex: TEX.icon_acid }),
  W({ id: 'bone_blade', name: '골검', class: '변이무기', caliber: 'none', baseDamage: 92, rpm: 80, range: 58, spreadDeg: 0, baseAccuracy: 0.9, weightKg: 0, reqLevel: 25, race: 'infected', price: 120_000, tex: TEX.icon_bone, iconTex: TEX.icon_bone }),
];
