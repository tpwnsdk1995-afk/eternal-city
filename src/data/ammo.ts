import type { AmmoDef } from './schema/item';
import { TEX } from './textureKeys';

export const AMMO: AmmoDef[] = [
  { kind: 'ammo', id: 'ammo_9mm_normal', name: '9mm 일반탄 박스', ammoKind: '일반탄', caliber: '9mm', boxSize: 100, weightKgPerRound: 0.008, price: 1_500, iconTex: TEX.icon_ammo_normal },
  { kind: 'ammo', id: 'ammo_9mm_incendiary', name: '9mm 소이탄 박스', ammoKind: '소이탄', caliber: '9mm', boxSize: 60, weightKgPerRound: 0.009, price: 3_000, iconTex: TEX.icon_ammo_incendiary },
  { kind: 'ammo', id: 'ammo_45_normal', name: '.45ACP 일반탄 박스', ammoKind: '일반탄', caliber: '.45ACP', boxSize: 80, weightKgPerRound: 0.012, price: 1_800, iconTex: TEX.icon_ammo_normal },
  { kind: 'ammo', id: 'ammo_45_incendiary', name: '.45ACP 소이탄 박스', ammoKind: '소이탄', caliber: '.45ACP', boxSize: 50, weightKgPerRound: 0.013, price: 3_500, iconTex: TEX.icon_ammo_incendiary },
];
