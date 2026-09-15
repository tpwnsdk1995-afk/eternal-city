import type { TexKey } from '../textureKeys';

export type NpcRole = 'skills' | 'shop' | 'assault' | 'dialog';

export interface NpcDef {
  id: string;
  name: string;
  role: NpcRole;
  tex: TexKey;
  lines: string[];
  /** For role 'shop': item ids sold. Weapons are sold at every grade in [gradeMin, gradeMax]. */
  stock?: string[];
  /** For role 'assault': assault ids offered. */
  assaults?: string[];
}
