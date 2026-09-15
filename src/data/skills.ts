import type { SkillDef } from './schema/skill';
import { TEX } from './textureKeys';

export const SKILLS: SkillDef[] = [
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
    id: 'skill_pistol_mastery',
    name: '권총 마스터리',
    category: '웨폰마스터리',
    reqTechGrade: 1,
    price: 8_000,
    maxRank: 5,
    weaponClass: '권총',
    modsPerRank: { dmgPct: 0.05, accPct: 0.02 },
    desc: '권총 장착 시 공격력 5%, 명중률 2%가 랭크당 증가한다.',
    iconTex: TEX.icon_skill_mastery,
  },
];
