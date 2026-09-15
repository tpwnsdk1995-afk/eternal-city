import Phaser from 'phaser';
import type { TexKey } from '@data/textureKeys';
import { theme } from './theme';

export interface ListRow {
  id: string;
  text: string;
  sub?: string;
  right?: string;
  color?: string;
  rightColor?: string;
  icon?: TexKey;
  disabled?: boolean;
  onClick?: (pointer: Phaser.Input.Pointer) => void;
}

/** Clickable rows with hover highlight and simple paging. Rebuilt on every setRows. */
export class ListView extends Phaser.GameObjects.Container {
  private rows: ListRow[] = [];
  private page = 0;
  private rowObjs: Phaser.GameObjects.GameObject[] = [];
  private pager: Phaser.GameObjects.GameObject[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly listW: number,
    private readonly rowH: number,
    private readonly maxRows: number,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
  }

  get totalHeight(): number {
    return this.maxRows * this.rowH + 22;
  }

  setRows(rows: ListRow[]): void {
    this.rows = rows;
    const pages = Math.max(1, Math.ceil(rows.length / this.maxRows));
    if (this.page >= pages) this.page = pages - 1;
    this.rebuild();
  }

  private rebuild(): void {
    for (const o of [...this.rowObjs, ...this.pager]) o.destroy();
    this.rowObjs = [];
    this.pager = [];

    const start = this.page * this.maxRows;
    const visible = this.rows.slice(start, start + this.maxRows);
    visible.forEach((r, i) => {
      const y = i * this.rowH;
      const bg = this.scene.add.rectangle(0, y, this.listW, this.rowH - 2, 0xffffff, 0.04).setOrigin(0, 0);
      if (r.onClick && !r.disabled) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setFillStyle(0xc9a227, 0.16));
        bg.on('pointerout', () => bg.setFillStyle(0xffffff, 0.04));
        bg.on('pointerdown', (p: Phaser.Input.Pointer) => r.onClick!(p));
      }
      const objs: Phaser.GameObjects.GameObject[] = [bg];
      let tx = 8;
      if (r.icon) {
        const icon = this.scene.add.image(4, y + (this.rowH - 2) / 2, r.icon).setOrigin(0, 0.5).setDisplaySize(24, 24);
        objs.push(icon);
        tx = 34;
      }
      const color = r.disabled ? '#6b7280' : (r.color ?? theme.colors.text);
      objs.push(this.scene.add.text(tx, y + 4, r.text, theme.textStyle(13, color)));
      if (r.sub) objs.push(this.scene.add.text(tx, y + 22, r.sub, theme.textStyle(11, r.disabled ? '#4b5563' : theme.colors.muted)));
      if (r.right) objs.push(this.scene.add.text(this.listW - 8, y + (this.rowH - 2) / 2, r.right, theme.textStyle(12, r.rightColor ?? theme.colors.brass)).setOrigin(1, 0.5));
      this.rowObjs.push(...objs);
      this.add(objs);
    });

    if (this.rows.length === 0) {
      const empty = this.scene.add.text(this.listW / 2, this.rowH, '비어 있음', theme.textStyle(12, '#6b7280')).setOrigin(0.5, 0);
      this.rowObjs.push(empty);
      this.add(empty);
    }

    const pages = Math.max(1, Math.ceil(this.rows.length / this.maxRows));
    if (pages > 1) {
      const py = this.maxRows * this.rowH + 2;
      const prev = this.scene.add.text(this.listW / 2 - 40, py, '◀', theme.textStyle(13, this.page > 0 ? theme.colors.brass : '#4b5563')).setInteractive({ useHandCursor: true });
      const next = this.scene.add.text(this.listW / 2 + 40, py, '▶', theme.textStyle(13, this.page < pages - 1 ? theme.colors.brass : '#4b5563')).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      const info = this.scene.add.text(this.listW / 2, py, `${this.page + 1} / ${pages}`, theme.textStyle(12, theme.colors.muted)).setOrigin(0.5, 0);
      prev.on('pointerdown', () => {
        if (this.page > 0) {
          this.page--;
          this.rebuild();
        }
      });
      next.on('pointerdown', () => {
        if (this.page < pages - 1) {
          this.page++;
          this.rebuild();
        }
      });
      this.pager.push(prev, next, info);
      this.add([prev, next, info]);
    }
  }
}
