import type { TexKey } from '../textureKeys';

export type NpcRole = 'skills' | 'shop' | 'assault' | 'dialog' | 'quest' | 'taxi' | 'tech' | 'parallel' | 'storage';

export interface NpcDef {
  id: string;
  name: string;
  role: NpcRole;
  tex: TexKey;
  /** Dialog-box face; the walking figure's front frame is used when absent. */
  face?: TexKey;
  lines: string[];
  /** For role 'shop': item ids sold. */
  stock?: string[];
  /** For role 'assault': assault ids offered. */
  assaults?: string[];
  /** For role 'quest': quest ids given, in story order. */
  quests?: string[];
}
