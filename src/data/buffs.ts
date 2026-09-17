import type { BuffDef } from '@core/combat/buffs';

const MIN = 60_000;
const DAY = 86_400_000;

/** 사이버샵 buffs. The original sold these for cash; here they cost ₩ (single-player). */
export const BUFFS: BuffDef[] = [
  { id: 'buff_steroid', name: '스테로이드', desc: '공격력 +15%', durationMs: 5 * MIN, mods: { dmgPct: 0.15 } },
  { id: 'buff_focus', name: '집중 렌즈', desc: '명중 +10% · 치명타 +5%', durationMs: 5 * MIN, mods: { accPct: 0.1, critPct: 0.05 } },
  { id: 'buff_ampoule', name: '경험 앰플', desc: '획득 경험치 +50%', durationMs: 30 * MIN, xpMult: 1.5 },
  { id: 'buff_hardening', name: '경화 주사', desc: '방어력 +20%', durationMs: 5 * MIN, mods: { defensePct: 0.2 } },
  { id: 'buff_adrenaline', name: '각성 주사', desc: '이동 속도 +15% · 공격 속도 +10%', durationMs: 5 * MIN, mods: { moveSpeedPct: 0.15, attackSpeedPct: 0.1 } },
  { id: 'buff_nerve', name: '신경 자극제', desc: '치명타 +15%', durationMs: 5 * MIN, mods: { critPct: 0.15 } },
  { id: 'buff_ampoule_xl', name: '경험 앰플 (대)', desc: '획득 경험치 +100%', durationMs: 60 * MIN, xpMult: 2 },
  { id: 'buff_won', name: '₩ 획득 쿠폰', desc: '₩ 획득 +30%', durationMs: 7 * DAY, wonMult: 1.3 },
  { id: 'buff_weight', name: '무게 확장 스티커', desc: '무게 한도 +20kg', durationMs: 30 * DAY, weightKg: 20 },
  { id: 'buff_pabang_clip', name: '파손 방지 클립', desc: '사망 시 장비가 파손되지 않음', durationMs: 7 * DAY },
  { id: 'buff_premium', name: '프리미엄 쿠폰', desc: '경험치 +30% · ₩ 획득 +20% · 무게 한도 +10kg', durationMs: 30 * DAY, xpMult: 1.3, wonMult: 1.2, weightKg: 10 },
];
