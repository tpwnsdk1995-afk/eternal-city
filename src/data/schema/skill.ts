import type { SkillCategory, WeaponClass } from './enums';
import type { StatMods } from './mods';
import type { TexKey } from '../textureKeys';

export interface SkillDef {
  id: string;
  name: string;
  category: SkillCategory;
  reqTechGrade: number;
  price: number;
  maxRank: number;
  weaponClass?: WeaponClass; // 웨폰마스터리 only
  apDrainPerSec?: number; // 퍼스널액티브 only
  /** Modifiers granted per rank (multiplied by rank). */
  modsPerRank: Partial<StatMods>;
  desc: string;
  iconTex: TexKey;
}
