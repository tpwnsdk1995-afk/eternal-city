import type { ArmorDef, ConsumableDef } from './schema/item';
import { TEX } from './textureKeys';

/**
 * 방어구 전 부위: 상의 · 하의 · 코트 · 신발 · 모자 · 가발. Three tiers per slot (Lv.1 / Lv.10 / Lv.20)
 * plus CL(×1.5) pieces for the coat and top, which is where the original's CL gear mattered most.
 */
export const ARMORS: ArmorDef[] = [
  // 상의
  { kind: 'armor', id: 'armor_top_basic', name: '작업용 재킷', slot: '상의', defense: 6, weightKg: 1.2, reqLevel: 1, price: 6_000, iconTex: TEX.icon_armor_top },
  { kind: 'armor', id: 'armor_top_police', name: '경찰 방검복', slot: '상의', defense: 14, weightKg: 2.4, reqLevel: 10, price: 42_000, iconTex: TEX.icon_armor_top },
  { kind: 'armor', id: 'armor_top_tactical', name: '전술 방탄복', slot: '상의', defense: 26, weightKg: 4.2, reqLevel: 20, price: 160_000, iconTex: TEX.icon_armor_top },
  { kind: 'armor', id: 'armor_top_tactical_cl', name: 'CL 전술 방탄복', slot: '상의', defense: 26, weightKg: 3.6, reqLevel: 20, price: 480_000, cl: true, iconTex: TEX.icon_armor_top },
  // 하의
  { kind: 'armor', id: 'armor_bottom_basic', name: '카고 팬츠', slot: '하의', defense: 4, weightKg: 0.9, reqLevel: 1, price: 4_500, iconTex: TEX.icon_armor_bottom },
  { kind: 'armor', id: 'armor_bottom_police', name: '경찰 근무복 하의', slot: '하의', defense: 9, weightKg: 1.4, reqLevel: 10, price: 30_000, iconTex: TEX.icon_armor_bottom },
  { kind: 'armor', id: 'armor_bottom_tactical', name: '전술 팬츠', slot: '하의', defense: 16, weightKg: 2.2, reqLevel: 20, price: 110_000, iconTex: TEX.icon_armor_bottom },
  // 코트
  { kind: 'armor', id: 'armor_coat_trench', name: '트렌치코트', slot: '코트', defense: 5, weightKg: 1.8, reqLevel: 3, price: 12_000, iconTex: TEX.icon_armor_coat },
  { kind: 'armor', id: 'armor_coat_leather', name: '가죽 롱코트', slot: '코트', defense: 12, weightKg: 3, reqLevel: 12, price: 70_000, iconTex: TEX.icon_armor_coat },
  { kind: 'armor', id: 'armor_coat_kevlar', name: '케블라 코트', slot: '코트', defense: 22, weightKg: 4.5, reqLevel: 22, price: 220_000, iconTex: TEX.icon_armor_coat },
  { kind: 'armor', id: 'armor_coat_kevlar_cl', name: 'CL 케블라 코트', slot: '코트', defense: 22, weightKg: 3.8, reqLevel: 22, price: 660_000, cl: true, iconTex: TEX.icon_armor_coat },
  // 신발
  { kind: 'armor', id: 'armor_shoes_sneakers', name: '운동화', slot: '신발', defense: 2, weightKg: 0.6, reqLevel: 1, price: 3_000, iconTex: TEX.icon_armor_shoes },
  { kind: 'armor', id: 'armor_shoes_boots', name: '전투화', slot: '신발', defense: 6, weightKg: 1.3, reqLevel: 10, price: 24_000, iconTex: TEX.icon_armor_shoes },
  { kind: 'armor', id: 'armor_shoes_tactical', name: '전술 부츠', slot: '신발', defense: 11, weightKg: 1.6, reqLevel: 20, price: 90_000, iconTex: TEX.icon_armor_shoes },
  // 모자
  { kind: 'armor', id: 'armor_hat_cap', name: '야구 모자', slot: '모자', defense: 1, weightKg: 0.2, reqLevel: 1, price: 2_000, iconTex: TEX.icon_armor_hat },
  { kind: 'armor', id: 'armor_hat_helmet', name: '경찰 방석모', slot: '모자', defense: 7, weightKg: 1.1, reqLevel: 10, price: 28_000, iconTex: TEX.icon_armor_hat },
  { kind: 'armor', id: 'armor_hat_tactical', name: '전술 헬멧', slot: '모자', defense: 13, weightKg: 1.5, reqLevel: 20, price: 100_000, iconTex: TEX.icon_armor_hat },
  // 가발 (원작: 외형 + 소량 방어)
  { kind: 'armor', id: 'armor_wig_short', name: '단발 가발', slot: '가발', defense: 1, weightKg: 0.1, reqLevel: 1, price: 5_000, iconTex: TEX.icon_armor_wig },
  { kind: 'armor', id: 'armor_wig_long', name: '장발 가발', slot: '가발', defense: 3, weightKg: 0.15, reqLevel: 8, price: 25_000, iconTex: TEX.icon_armor_wig },
];

export const CONSUMABLES: ConsumableDef[] = [
  { kind: 'consumable', id: 'bandage', name: '붕대', effect: { hp: 40 }, weightKg: 0.1, price: 800, iconTex: TEX.icon_bandage },
  { kind: 'consumable', id: 'energy_drink', name: '에너지 드링크', effect: { stamina: 60 }, weightKg: 0.2, price: 600, iconTex: TEX.icon_energy_drink },
  { kind: 'consumable', id: 'painkiller', name: '진통제', effect: { hp: 15, ap: 10 }, weightKg: 0.05, price: 500, iconTex: TEX.icon_painkiller },
  // ---------------------------------------------------------------- 사이버샵 (원작 캐시 아이템 → ₩)
  { kind: 'consumable', id: 'hp_pack', name: '피뻥 (대회복 팩)', effect: { hp: 250 }, weightKg: 0.2, price: 3_000, iconTex: TEX.icon_hp_pack },
  { kind: 'consumable', id: 'stamina_pack', name: '지감 (지구력 회복제)', effect: { stamina: 100, ap: 40 }, weightKg: 0.2, price: 2_000, iconTex: TEX.icon_energy_drink },
  { kind: 'consumable', id: 'steroid_shot', name: '스테로이드', effect: { buff: 'buff_steroid' }, weightKg: 0.1, price: 15_000, iconTex: TEX.icon_syringe },
  { kind: 'consumable', id: 'focus_lens', name: '집중 렌즈', effect: { buff: 'buff_focus' }, weightKg: 0.05, price: 12_000, iconTex: TEX.icon_lens },
  { kind: 'consumable', id: 'ampoule', name: '경험 앰플', effect: { buff: 'buff_ampoule' }, weightKg: 0.1, price: 25_000, iconTex: TEX.icon_ampoule },
  { kind: 'consumable', id: 'enhance_ticket', name: '특수 강화권', effect: { enhanceBonusPct: 20 }, weightKg: 0.01, price: 40_000, iconTex: TEX.icon_ticket },
  { kind: 'consumable', id: 'premium_coupon', name: '프리미엄 쿠폰 (30일)', effect: { buff: 'buff_premium' }, weightKg: 0.01, price: 300_000, iconTex: TEX.icon_coupon },
];
