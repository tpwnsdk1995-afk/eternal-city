import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
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
    const titleBand = scene.add.rectangle(5, 5, w - 10, 27, 0x07080a, 0.75).setOrigin(0, 0);
    this.titleText = scene.add.text(14, 9, title, theme.textStyle(15, theme.colors.brass, { fontStyle: 'bold' }));
    const close = scene.add
      .text(w - 14, 8, '✕', theme.textStyle(15, theme.colors.muted))
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    close.on('pointerover', () => close.setColor('#ffffff'));
    close.on('pointerout', () => close.setColor(theme.colors.muted));
    close.on('pointerdown', () => this.emit('close'));
    const rule = scene.add.rectangle(5, 32, w - 10, 1, 0xc9a227, 0.6).setOrigin(0, 0);
    this.content = scene.add.container(0, 40);
    this.add([panel, titleBand, this.titleText, close, rule, this.content]);
    this.setDepth(100);
    scene.add.existing(this);
  }

  setTitle(t: string): void {
    this.titleText.setText(t);
  }

  /** Screen-space hit test used to block world input under the window. */
  contains(sx: number, sy: number): boolean {
    return this.visible && sx >= this.x && sx < this.x + this.w && sy >= this.y && sy < this.y + this.h;
  }

  /** Rebuild contents from current state. */
  abstract refresh(): void;

  private buttons: Phaser.GameObjects.Text[] = [];

  protected clearBody(): void {
    this.content.removeAll(true);
    this.buttons = [];
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

  protected label(x: number, y: number, text: string, color = theme.colors.text, size = 13, extra: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.GameObjects.Text {
    const t = this.scene.add.text(x, y, text, theme.textStyle(size, color, extra));
    this.content.add(t);
    return t;
  }
}
