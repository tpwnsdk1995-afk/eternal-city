import Dexie, { type Table } from 'dexie';
import type { SaveGame } from '@core/save/saveSchema';

export interface SaveRow {
  slot: number;
  name: string;
  level: number;
  mapName: string;
  updatedAt: number;
  data: SaveGame;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

/** IndexedDB store for saves and settings. */
export class EcDb extends Dexie {
  saves!: Table<SaveRow, number>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'eternal-city') {
    super(name);
    this.version(1).stores({ saves: 'slot, updatedAt', settings: 'key' });
  }
}

export const db = new EcDb();
