import type Phaser from 'phaser';
import type { NpcDef } from '@data/schema/npc';
import { Window } from './Window';
import { theme } from './theme';
import { DIR_S, figureFrame } from '../systems/facing';

export interface DialogOption {
  label: string;
  onPick: () => void;
  color?: string;
}

/** NPC speech box with option buttons, anchored above the HUD bar. */
export class DialogBox extends Window {
  private npc: NpcDef | null = null;
  private line = '';
  private options: DialogOption[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, w: number) {
    super(scene, 'dialog', x, y, w, 150, '대화');
  }

  show(npc: NpcDef, line: string, options: DialogOption[]): void {
    this.npc = npc;
    this.line = line;
    this.options = options;
    this.setTitle(npc.name);
    this.refresh();
  }

  refresh(): void {
    this.clearBody();
    if (!this.npc) return;
    const frame = figureFrame(DIR_S, 0);
    const face = this.npc.face && this.scene.textures.exists(this.npc.face) ? this.npc.face : null;
    const hasFigureFrames = !face && this.scene.textures.get(this.npc.tex).has(String(frame));
    const img = this.scene.add.image(20, 2, face ?? this.npc.tex, face ? 0 : hasFigureFrames ? frame : 0).setOrigin(0, 0).setDisplaySize(64, 64);
    this.content.add(img);
    if (face) this.content.add(this.scene.add.rectangle(20, 2, 64, 64).setOrigin(0, 0).setStrokeStyle(1, 0xc9a227, 0.7));
    this.label(84, 6, this.line, theme.colors.text, 14, { wordWrap: { width: this.w - 110 } });
    let x = 84;
    for (const o of this.options) {
      const b = this.button(x, 70, o.label, o.onPick, o.color ?? theme.colors.brass, 13);
      x += b.width + 10;
    }
  }
}
