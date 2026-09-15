export const STAT_KEYS = ['생명력', '체력', '지구력', '기술', '지능', '속도'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export const SKINS = ['일반', '연성', '변이', '강성', '장갑', '중장갑'] as const;
export type Skin = (typeof SKINS)[number];

export const WEAPON_CLASSES = ['권총', '기관단총', '돌격소총', '산탄총', '저격소총', '기관총', '근접무기', '투척중화기', '변이무기'] as const;
export type WeaponClass = (typeof WEAPON_CLASSES)[number];

export const AMMO_KINDS = ['일반탄', '소이탄', '철갑탄', 'Slug', '대전차탄'] as const;
export type AmmoKind = (typeof AMMO_KINDS)[number];

export const CALIBERS = ['9mm', '.45ACP', '5.56mm', '7.62mm', '12ga', '.50BMG', 'rocket', 'grenade', 'none'] as const;
export type Caliber = (typeof CALIBERS)[number];

export const SKILL_CATEGORIES = ['퍼스널패시브', '퍼스널액티브', '웨폰마스터리'] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const ARMOR_SLOTS = ['상의', '하의', '코트', '신발', '모자', '가발'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

export type Faction = 'zombie' | 'WITO' | 'GUEST' | 'boss';

export type ControlScheme = 'classic' | 'modern';

/** 인간 / 감염체 — the two playable races of the original */
export const RACES = ['human', 'infected'] as const;
export type Race = (typeof RACES)[number];
export const RACE_NAME: Record<Race, string> = { human: '인간', infected: '감염체' };

/** classes that swing instead of shooting (no ammo): 근접무기 and the 감염체's 변이무기 */
export const MELEE_CLASSES: readonly WeaponClass[] = ['근접무기', '변이무기'];
export const isMeleeClass = (c: WeaponClass): boolean => MELEE_CLASSES.includes(c);
