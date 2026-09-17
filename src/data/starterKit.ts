import type { Race } from './schema/enums';

interface StarterKit {
  won: number;
  items: readonly { itemId: string; qty: number }[];
  equipWeaponItemId: string;
}

/** What a brand-new character starts with in 광진구청 지하주차장, by race. */
export const STARTER_KITS: Record<Race, StarterKit> = {
  human: {
    won: 5_000,
    items: [
      { itemId: 'glock17', qty: 1 },
      { itemId: 'ammo_9mm_normal', qty: 100 },
      { itemId: 'bandage', qty: 2 },
    ],
    equipWeaponItemId: 'glock17',
  },
  infected: {
    won: 5_000,
    items: [
      { itemId: 'claws', qty: 1 },
      { itemId: 'bandage', qty: 2 },
    ],
    equipWeaponItemId: 'claws',
  },
};

export const STARTER_KIT = STARTER_KITS.human;
