/**
 * Art-neutral texture keys. Every sprite the game draws is referenced through these constants;
 * `game/textures/manifest.ts` decides whether a key is procedurally drawn or loaded from a PNG.
 */
export const TEX = {
  // world
  tiles: 'tiles',
  // player
  player: 'player',
  portrait_player: 'portrait_player',
  // zombies (2002 중곡동)
  zombie_casual_f: 'zombie_casual_f',
  zombie_suit_m: 'zombie_suit_m',
  zombie_stripe: 'zombie_stripe',
  zombie_banshee: 'zombie_banshee',
  zombie_lord: 'zombie_lord',
  // W.I.T.O
  wito_recon: 'wito_recon',
  wito_airborne: 'wito_airborne',
  // npcs
  npc_elia: 'npc_elia',
  npc_shop: 'npc_shop',
  npc_assault: 'npc_assault',
  // street decor (drawn with bottom origin)
  deco_lamp: 'deco_lamp',
  deco_vending: 'deco_vending',
  deco_trash: 'deco_trash',
  deco_phone: 'deco_phone',
  deco_sign: 'deco_sign',
  deco_tree: 'deco_tree',
  deco_hydrant: 'deco_hydrant',
  deco_bench: 'deco_bench',
  deco_busstop: 'deco_busstop',
  deco_pillar: 'deco_pillar',
  // objects
  barricade: 'barricade',
  gate: 'gate',
  booth: 'booth',
  pickup_won: 'pickup_won',
  pickup_item: 'pickup_item',
  // fx
  tracer: 'tracer',
  muzzle: 'muzzle',
  blood: 'blood',
  fire: 'fire',
  jump_marker: 'jump_marker',
  // ui
  ui_panel: 'ui_panel',
  ui_slot: 'ui_slot',
  crosshair: 'crosshair',
  // icons
  icon_pistol: 'icon_pistol',
  icon_smg: 'icon_smg',
  icon_ammo_normal: 'icon_ammo_normal',
  icon_ammo_incendiary: 'icon_ammo_incendiary',
  icon_armor_top: 'icon_armor_top',
  icon_armor_bottom: 'icon_armor_bottom',
  icon_skill_passive: 'icon_skill_passive',
  icon_skill_mastery: 'icon_skill_mastery',
  icon_consumable: 'icon_consumable',
} as const;

export type TexKey = (typeof TEX)[keyof typeof TEX];

export const ANIM = {
  fire_burn: 'fire_burn',
} as const;

export type AnimKey = (typeof ANIM)[keyof typeof ANIM];

/** Tile ids inside the `tiles` atlas (32x32 cells, left-to-right). 0 = empty. */
export const TILE = {
  empty: 0,
  asphalt: 1,
  sidewalk: 2,
  roadLine: 3,
  grass: 4,
  buildingRoof: 5,
  car: 6,
  concreteWall: 7,
  parkingPillar: 8,
  parkingStripe: 9,
  parkingFloor: 10,
  portalGlow: 11,
  fence: 12,
  gateClosed: 13,
  dirt: 14,
  // variants assigned by mapBuild's decorate pass (never placed by map data directly, except crosswalk)
  buildingWall: 15,
  asphaltCrack: 16,
  manhole: 17,
  crosswalk: 18,
  oilStain: 19,
  carL: 20,
  carR: 21,
  carT: 22,
  carB: 23,
  sidewalkCrack: 24,
  roofEdge: 25,
} as const;

export type TileKey = keyof typeof TILE;
