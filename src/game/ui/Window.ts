import Phaser from 'phaser';
import { GAME_HEIGHT } from '../../config/gameConfig';
import { TEX } from '@data/textureKeys';
import { registry } from '@data/registry';
import type { ItemStack } from '@data/schema/item';
import { FILTERS, FILTER_LABEL, SORT_LABEL, filterStacks, nextSortMode, type InventoryFilter, type SortMode } from '@core/inventory/sortFilter';
import { theme } from './theme';

/** Draggable-free fixed panel with a title bar and close button. Subclasses fill `body`. */
export abstract class Window extends Phaser.GameObjects.Container {
  readonly key: string;
  readonly w: number;
  readonly h: number;
  protected content: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, key: string, x: number, y: number, w: number, h: number, title: string) {
    super(scene, x, y);
    this.key = key;
    this.w = w;
    this.h = h;
    const panel = scene.add.nineslice(0, 0, TEX.ui_panel, 0, w, h, 8, 8, 8, 8).setOrigin(0, 0);
    // swallow clicks so the world underneath never receives them
    panel.setInteractive();
    // body a shade lighter than the frame so text and icons read; framed by a second inner line
    const body = scene.add.rectangle(6, 36, w - 12, h - 42, 0x161a21, 0.72).setOrigin(0, 0);
    const inner = scene.add.rectangle(6, 36, w - 12, h - 42).setOrigin(0, 0).setStrokeStyle(1, 0x3a414d, 1).setFillStyle();
    // sunken steel title band with an emblem square on the left
    const titleBand = scene.add.nineslice(6, 6, TEX.ui_slot, 0, w - 12, 26, 3, 3, 3, 3).setOrigin(0, 0);
    const emblem = scene.add.nineslice(10, 10, TEX.ui_button, 0, 18, 18, 3, 3, 3, 3).setOrigin(0, 0);
    const emblemDot = scene.add.rectangle(19, 19, 6, 6, 0xc9a227, 1);
    this.titleText = scene.add.text(34, 9, title, theme.textStyle(15, theme.colors.brass, { fontStyle: 'bold' }));
    // close button: 26px box, but a 64px tap zone around it so a thumb lands it on a phone
    const closeBtn = scene.add.nineslice(w - 34, 6, TEX.ui_button, 0, 26, 26, 3, 3, 3, 3).setOrigin(0, 0)
      .setInteractive({ hitArea: new Phaser.Geom.Rectangle(-19, -19, 64, 64), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    const closeX = scene.add.text(w - 21, 19, '✕', theme.textStyle(17, '#e5e7eb', { fontStyle: 'bold' })).setOrigin(0.5);
    closeBtn.on('pointerover', () => closeX.setColor('#ffd166'));
    closeBtn.on('pointerout', () => closeX.setColor('#e5e7eb'));
    closeBtn.on('pointerdown', () => this.emit('close'));
    const rule = scene.add.rectangle(6, 33, w - 12, 1, 0xc9a227, 0.5).setOrigin(0, 0);
    this.content = scene.add.container(0, 40);
    this.add([panel, body, inner, titleBand, emblem, emblemDot, this.titleText, closeBtn, closeX, rule, this.content]);
    this.setDepth(100);
    // phone canvas is shorter than the tallest windows: shrink to fit and pull up so the whole window stays on screen
    const fit = Math.min(1, GAME_HEIGHT / h);
    this.setScale(fit);
    if (y + h * fit > GAME_HEIGHT) this.y = Math.max(0, GAME_HEIGHT - h * fit);
    scene.add.existing(this);
  }

  setTitle(t: string): void {
    this.titleText.setText(t);
  }

  /** Screen-space hit test used to block world input under the window. */
  contains(sx: number, sy: number): boolean {
    return this.visible && sx >= this.x && sx < this.x + this.w * this.scaleX && sy >= this.y && sy < this.y + this.h * this.scaleY;
  }

  /** Rebuild contents from current state. */
  abstract refresh(): void;

  private buttons: Phaser.GameObjects.Text[] = [];
  /** A tapped action waits here until 확인/취소 — one stray tap must not spend ₩ or a stat point. */
  protected pending: { text: string; run: () => void } | null = null;

  protected clearBody(): void {
    this.content.removeAll(true);
    this.buttons = [];
  }

  protected confirm(text: string, run: () => void): void {
    this.pending = { text, run };
    this.refresh();
  }

  /** Draws the pending question with 확인/취소 in the middle of the body; returns true when it did (caller skips its normal body). */
  protected drawConfirm(): boolean {
    const p = this.pending;
    if (!p) return false;
    this.label(this.w / 2, this.h / 2 - 60, p.text, '#ffffff', 18, { fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0.5);
    this.button(this.w / 2 - 90, this.h / 2, '확인', () => { this.pending = null; p.run(); this.refresh(); }, theme.colors.brass, 16);
    this.button(this.w / 2 + 30, this.h / 2, '취소', () => { this.pending = null; this.refresh(); }, theme.colors.muted, 16);
    return true;
  }

  /** Screen-space centre of the first button whose label starts with `label` (debug/e2e). */
  buttonPos(label: string): { x: number; y: number } | null {
    const b = this.buttons.find((t) => t.active && t.text.startsWith(label));
    if (!b) return null;
    return { x: this.x + this.content.x + b.x + b.width / 2, y: this.y + this.content.y + b.y + b.height / 2 };
  }

  /** Small clickable text button. */
  protected button(x: number, y: number, label: string, onClick: (p: Phaser.Input.Pointer) => void, color = theme.colors.brass, size = 12): Phaser.GameObjects.Text {
    const t = this.scene.add
      .text(x, y, label, theme.textStyle(size, color, { backgroundColor: '#1a1e24', padding: { left: 6, right: 6, top: 2, bottom: 2 } }))
      .setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setStyle({ backgroundColor: '#2a3038' }));
    t.on('pointerout', () => t.setStyle({ backgroundColor: '#1a1e24' }));
    t.on('pointerdown', (p: Phaser.Input.Pointer) => onClick(p));
    this.content.add(t);
    this.buttons.push(t);
    return t;
  }

  /** Filter tabs (left) + sort toggle (right) for an item list; mutates `view` and calls `onChange` to re-render. */
  protected filterSortBar(y: number, items: ItemStack[], view: { filter: InventoryFilter; sortMode: SortMode }, onChange: () => void): void {
    let bx = 12;
    for (const f of FILTERS) {
      const n = f === 'all' ? items.length : filterStacks(items, registry.item, f).length;
      const b = this.button(bx, y, FILTER_LABEL[f], () => {
        view.filter = f;
        onChange();
      }, f === view.filter ? '#ffffff' : n === 0 ? '#4b5563' : theme.colors.muted, 11);
      if (f === view.filter) b.setStyle({ backgroundColor: '#3a4048' });
      bx += b.width + 4;
    }
    const sortBtn = this.button(this.w - 12, y, `정렬: ${SORT_LABEL[view.sortMode]}`, () => {
      view.sortMode = nextSortMode(view.sortMode);
      onChange();
    }, theme.colors.brass, 11);
    sortBtn.setX(this.w - 12 - sortBtn.width);
  }

  protected label(x: number, y: number, text: string, color = theme.colors.text, size = 13, extra: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.GameObjects.Text {
    const t = this.scene.add.text(x, y, text, theme.textStyle(size, color, extra));
    this.content.add(t);
    return t;
  }
}
