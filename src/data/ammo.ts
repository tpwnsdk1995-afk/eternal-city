import type { AmmoDef } from './schema/item';
import { TEX } from './textureKeys';

export const AMMO: AmmoDef[] = [
  // 9mm (권총 · 기관단총)
  { kind: 'ammo', id: 'ammo_9mm_normal', name: '9mm 일반탄 박스', ammoKind: '일반탄', caliber: '9mm', boxSize: 1000, weightKgPerRound: 0.008, price: 15_000, iconTex: TEX.icon_ammo_normal },
  { kind: 'ammo', id: 'ammo_9mm_incendiary', name: '9mm 소이탄 박스', ammoKind: '소이탄', caliber: '9mm', boxSize: 500, weightKgPerRound: 0.009, price: 25_000, iconTex: TEX.icon_ammo_incendiary },
  { kind: 'ammo', id: 'ammo_9mm_ap', name: '9mm 철갑탄 박스', ammoKind: '철갑탄', caliber: '9mm', boxSize: 500, weightKgPerRound: 0.01, price: 30_000, iconTex: TEX.icon_ammo_ap },
  // .45ACP
  { kind: 'ammo', id: 'ammo_45_normal', name: '.45ACP 일반탄 박스', ammoKind: '일반탄', caliber: '.45ACP', boxSize: 1000, weightKgPerRound: 0.012, price: 22_500, iconTex: TEX.icon_ammo_normal },
  { kind: 'ammo', id: 'ammo_45_incendiary', name: '.45ACP 소이탄 박스', ammoKind: '소이탄', caliber: '.45ACP', boxSize: 500, weightKgPerRound: 0.013, price: 35_000, iconTex: TEX.icon_ammo_incendiary },
  { kind: 'ammo', id: 'ammo_45_ap', name: '.45ACP 철갑탄 박스', ammoKind: '철갑탄', caliber: '.45ACP', boxSize: 500, weightKgPerRound: 0.014, price: 42_000, iconTex: TEX.icon_ammo_ap },
  // 5.56mm (돌격소총 · 경기관총)
  { kind: 'ammo', id: 'ammo_556_normal', name: '5.56mm 일반탄 박스', ammoKind: '일반탄', caliber: '5.56mm', boxSize: 1000, weightKgPerRound: 0.012, price: 30_000, iconTex: TEX.icon_ammo_normal },
  { kind: 'ammo', id: 'ammo_556_incendiary', name: '5.56mm 소이탄 박스', ammoKind: '소이탄', caliber: '5.56mm', boxSize: 500, weightKgPerRound: 0.013, price: 35_000, iconTex: TEX.icon_ammo_incendiary },
  { kind: 'ammo', id: 'ammo_556_ap', name: '5.56mm 철갑탄 박스', ammoKind: '철갑탄', caliber: '5.56mm', boxSize: 500, weightKgPerRound: 0.014, price: 40_000, iconTex: TEX.icon_ammo_ap },
  // 7.62mm (돌격소총 · 저격소총 · 기관총)
  { kind: 'ammo', id: 'ammo_762_normal', name: '7.62mm 일반탄 박스', ammoKind: '일반탄', caliber: '7.62mm', boxSize: 1000, weightKgPerRound: 0.024, price: 45_000, iconTex: TEX.icon_ammo_normal },
  { kind: 'ammo', id: 'ammo_762_incendiary', name: '7.62mm 소이탄 박스', ammoKind: '소이탄', caliber: '7.62mm', boxSize: 500, weightKgPerRound: 0.025, price: 62_500, iconTex: TEX.icon_ammo_incendiary },
  { kind: 'ammo', id: 'ammo_762_ap', name: '7.62mm 철갑탄 박스', ammoKind: '철갑탄', caliber: '7.62mm', boxSize: 500, weightKgPerRound: 0.027, price: 75_000, iconTex: TEX.icon_ammo_ap },
  // 12ga (산탄총)
  { kind: 'ammo', id: 'ammo_12ga_shot', name: '12게이지 산탄 박스', ammoKind: '일반탄', caliber: '12ga', boxSize: 200, weightKgPerRound: 0.045, price: 16_000, iconTex: TEX.icon_ammo_shell },
  { kind: 'ammo', id: 'ammo_12ga_slug', name: '12게이지 Slug 박스', ammoKind: 'Slug', caliber: '12ga', boxSize: 150, weightKgPerRound: 0.05, price: 24_000, iconTex: TEX.icon_ammo_slug },
  // .50BMG (대물 저격)
  { kind: 'ammo', id: 'ammo_50_ap', name: '.50BMG 철갑탄 박스', ammoKind: '철갑탄', caliber: '.50BMG', boxSize: 100, weightKgPerRound: 0.12, price: 60_000, iconTex: TEX.icon_ammo_ap },
  // 유탄 · 로켓
  { kind: 'ammo', id: 'ammo_grenade', name: '40mm 유탄 상자', ammoKind: '일반탄', caliber: 'grenade', boxSize: 30, weightKgPerRound: 0.25, price: 45_000, iconTex: TEX.icon_ammo_grenade },
  { kind: 'ammo', id: 'ammo_rocket', name: 'RPG 대전차 로켓', ammoKind: '대전차탄', caliber: 'rocket', boxSize: 12, weightKgPerRound: 2.2, price: 72_000, iconTex: TEX.icon_ammo_rocket },
];
