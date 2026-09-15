import type { ArmorDef, ConsumableDef } from './schema/item';
import { TEX } from './textureKeys';

export const ARMORS: ArmorDef[] = [
  { kind: 'armor', id: 'armor_top_basic', name: '작업용 재킷', slot: '상의', defense: 6, weightKg: 1.2, reqLevel: 1, price: 6_000, iconTex: TEX.icon_armor_top },
  { kind: 'armor', id: 'armor_bottom_basic', name: '카고 팬츠', slot: '하의', defense: 4, weightKg: 0.9, reqLevel: 1, price: 4_500, iconTex: TEX.icon_armor_bottom },
];

export const CONSUMABLES: ConsumableDef[] = [
  { kind: 'consumable', id: 'bandage', name: '붕대', effect: { hp: 40 }, weightKg: 0.1, price: 800, iconTex: TEX.icon_bandage },
  { kind: 'consumable', id: 'energy_drink', name: '에너지 드링크', effect: { stamina: 60 }, weightKg: 0.2, price: 600, iconTex: TEX.icon_energy_drink },
];
