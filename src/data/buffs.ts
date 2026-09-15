import type { BuffDef } from '@core/combat/buffs';

const MIN = 60_000;
const DAY = 86_400_000;

/** 사이버샵 buffs. The original sold these for cash; here they cost ₩ (single-player). */
export const BUFFS: BuffDef[] = [
  { id: 'buff_steroid', name: '스테로이드', desc: '공격력 +15%', durationMs: 5 * MIN, mods: { dmgPct: 0.15 } },
  { id: 'buff_focus', name: '집중 렌즈', desc: '명중 +10% · 치명타 +5%', durationMs: 5 * MIN, mods: { accPct: 0.1, critPct: 0.05 } },
  { id: 'buff_ampoule', name: '경험 앰플', desc: '획득 경험치 +50%', durationMs: 30 * MIN, xpMult: 1.5 },
  { id: 'buff_premium', name: '프리미엄 쿠폰', desc: '경험치 +30% · ₩ 획득 +20% · 무게 한도 +10kg', durationMs: 30 * DAY, xpMult: 1.3, wonMult: 1.2, weightKg: 10 },
];
