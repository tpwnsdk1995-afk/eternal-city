import type { PartDef, PartId, UniqueDef, UniqueId } from './schema/tuning';

const GUNS = ['권총', '기관단총', '돌격소총', '산탄총', '저격소총', '기관총'] as const;

/** 부품 개조 — 기술상에서 장착. 분류별 허용 표는 원작의 "총열/조준경/확장탄창/개머리판" 구성을 따른다. */
export const PARTS: Record<PartId, PartDef> = {
  barrel: { id: 'barrel', name: '총열', desc: '사거리 +15%', allowedClasses: GUNS, rangePct: 0.15, priceMult: 0.35 },
  scope: { id: 'scope', name: '조준경', desc: '명중 +5%', allowedClasses: ['돌격소총', '저격소총', '기관단총', '기관총', '산탄총'], accPct: 0.05, priceMult: 0.4 },
  magazine: { id: 'magazine', name: '확장탄창', desc: '연사속도 +5%', allowedClasses: ['권총', '기관단총', '돌격소총', '기관총'], rpmPct: 0.05, priceMult: 0.3 },
  stock: { id: 'stock', name: '개머리판', desc: '탄퍼짐 −20%', allowedClasses: ['기관단총', '돌격소총', '산탄총', '저격소총', '기관총'], spreadPct: -0.2, priceMult: 0.3 },
};

/** 유니크 개조 — +7 이상에서 시도, 성공 시 접미 하나가 붙는다. */
export const UNIQUES: Record<UniqueId, UniqueDef> = {
  precision: { id: 'precision', name: '정밀', desc: '치명타 확률 +5%', critPct: 0.05 },
  destruction: { id: 'destruction', name: '파괴', desc: '공격력 +8%', dmgPct: 0.08 },
  swiftness: { id: 'swiftness', name: '신속', desc: '연사속도 +8%', rpmPct: 0.08 },
  endurance: { id: 'endurance', name: '장거리', desc: '사거리 +12%', rangePct: 0.12 },
};
