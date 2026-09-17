import Phaser from 'phaser';
import { TEX } from '@data/textureKeys';
import { registry } from '@data/registry';
import { theme } from '../ui/theme';

export type PickupPayload = { kind: 'won'; amount: number } | { kind: 'item'; itemId: string; qty: number; prefix?: '고대' | '전설' };

const LIFETIME_MS = 60_000;

/** Ground drop: walk over it to collect (handled by CombatBridge). */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  readonly payload: PickupPayload;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, payload: PickupPayload) {
    super(scene, x, y, payload.kind === 'won' ? TEX.pickup_won : TEX.pickup_item, 0);
    this.payload = payload;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const reach = 28; // wide body so a pass-by scoops it up
    this.setCircle(reach, this.width / 2 - reach, this.height / 2 - reach);
    this.setDepth(5);
    const prefix = payload.kind === 'item' && payload.prefix ? `${payload.prefix} ` : '';
    const text = payload.kind === 'won' ? `₩${payload.amount}` : `${prefix}${registry.item(payload.itemId).name}${payload.qty > 1 ? ` ×${payload.qty}` : ''}`;
    const color = payload.kind === 'won' ? theme.colors.brass : prefix === '전설 ' ? '#ffd166' : prefix === '고대 ' ? '#c9a7ff' : '#cfe3ff';
    this.label = scene.add.text(x, y - 14, text, theme.textStyle(10, color, { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5).setDepth(6);
    scene.tweens.add({ targets: this, y: y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.time.delayedCall(LIFETIME_MS, () => {
      if (!this.active) return;
      scene.tweens.add({ targets: [this, this.label], alpha: 0, duration: 800, onComplete: () => this.destroy() });
    });
  }

  destroy(fromScene?: boolean): void {
    this.label.destroy();
    super.destroy(fromScene);
  }
}
