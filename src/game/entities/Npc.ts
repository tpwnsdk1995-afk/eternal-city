import Phaser from 'phaser';
import type { NpcDef } from '@data/schema/npc';
import { theme } from '../ui/theme';
import { DIR_S, depthForY, figureFrame } from '../systems/facing';

export const NPC_INTERACT_RADIUS = 56;

/** Static NPC: front-facing figure + floating name label. Interaction is resolved by the world scene. */
export class Npc extends Phaser.GameObjects.Container {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly def: NpcDef,
  ) {
    super(scene, x, y);
    this.sprite = scene.add.sprite(0, -4, def.tex, figureFrame(DIR_S, 0));
    this.label = scene.add
      .text(0, -34, def.name, theme.textStyle(12, theme.colors.brass, { stroke: '#000', strokeThickness: 3 }))
      .setOrigin(0.5);
    this.add([this.sprite, this.label]);
    this.setDepth(depthForY(y));
    scene.add.existing(this);
  }

  /** Highlights the label when the player is close enough to talk. */
  setNear(near: boolean): void {
    this.label.setColor(near ? '#ffffff' : theme.colors.brass);
  }
}
