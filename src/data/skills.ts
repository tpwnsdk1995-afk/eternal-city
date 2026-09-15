import type { SkillDef } from './schema/skill';
import type { WeaponClass } from './schema/enums';
import { TEX } from './textureKeys';

const mastery = (id: string, name: string, weaponClass: WeaponClass, reqTechGrade: number, price: number, dmg: number, extra: Partial<SkillDef['modsPerRank']>, extraDesc: string): SkillDef => ({
  id,
  name,
  category: '웨폰마스터리',
  reqTechGrade,
  price,
  maxRank: 5,
  weaponClass,
  modsPerRank: { dmgPct: dmg, ...extra },
  desc: `${weaponClass} 장착 시 공격력 ${Math.round(dmg * 100)}%${extraDesc}가 랭크당 증가한다.`,
  iconTex: TEX.icon_skill_mastery,
});

export const SKILLS: SkillDef[] = [
  // ---------------------------------------------------------------- 퍼스널 패시브
  {
    id: 'skill_tough_body',
    name: '강인한 체력',
    category: '퍼스널패시브',
    reqTechGrade: 1,
    price: 5_000,
    maxRank: 5,
    modsPerRank: { maxHpPct: 0.04 },
    desc: '최대 생명력이 랭크당 4% 증가한다.',
    iconTex: TEX.icon_skill_passive,
  },
  {
    id: 'skill_light_step',
    name: '가벼운 발걸음',
    category: '퍼스널패시브',
    reqTechGrade: 2,
    price: 9_000,
    maxRank: 5,
    modsPerRank: { moveSpeedPct: 0.03, maxStaminaPct: 0.04 },
    desc: '이동속도 3%, 최대 지구력 4%가 랭크당 증가한다.',
    iconTex: TEX.icon_skill_passive,
  },
  // ---------------------------------------------------------------- 퍼스널 액티브 (행동력 지속 소모)
  {
    id: 'skill_enhanced_sight',
    name: '강화 시력',
    category: '퍼스널액티브',
    reqTechGrade: 1,
    price: 12_000,
    maxRank: 5,
    apDrainPerSec: 2,
    modsPerRank: { accPct: 0.04, critPct: 0.01 },
    desc: '활성 중 명중 4%, 치명타 1%가 랭크당 증가한다. 행동력을 초당 2 소모한다.',
    iconTex: TEX.icon_skill_active,
  },
  {
    id: 'skill_combat_stim',
    name: '전투 자극',
    category: '퍼스널액티브',
    reqTechGrade: 2,
    price: 20_000,
    maxRank: 5,
    apDrainPerSec: 3,
    modsPerRank: { attackSpeedPct: 0.05, dmgPct: 0.02 },
    desc: '활성 중 공격속도 5%, 공격력 2%가 랭크당 증가한다. 행동력을 초당 3 소모한다.',
    iconTex: TEX.icon_skill_active,
  },
  // ---------------------------------------------------------------- 웨폰 마스터리 (분류별)
  mastery('skill_pistol_mastery', '권총 마스터리', '권총', 1, 8_000, 0.05, { accPct: 0.02 }, ', 명중률 2%'),
  mastery('skill_smg_mastery', '기관단총 마스터리', '기관단총', 1, 10_000, 0.04, { attackSpeedPct: 0.02 }, ', 공격속도 2%'),
  mastery('skill_rifle_mastery', '돌격소총 마스터리', '돌격소총', 2, 16_000, 0.05, { accPct: 0.02 }, ', 명중률 2%'),
  mastery('skill_shotgun_mastery', '산탄총 마스터리', '산탄총', 2, 16_000, 0.06, {}, ''),
  mastery('skill_sniper_mastery', '저격소총 마스터리', '저격소총', 3, 24_000, 0.05, { critPct: 0.02 }, ', 치명타 2%'),
  mastery('skill_mg_mastery', '기관총 마스터리', '기관총', 3, 24_000, 0.05, { accPct: 0.02 }, ', 명중률 2%'),
  mastery('skill_melee_mastery', '근접무기 마스터리', '근접무기', 1, 8_000, 0.07, { attackSpeedPct: 0.03 }, ', 공격속도 3%'),
];
