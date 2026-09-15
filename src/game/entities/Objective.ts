import Phaser from 'phaser';
import type { ObjectiveDef } from '@data/schema/map';
import type { Vec2 } from '@core/math/vec';
import { setObjectiveBlocked, type BuiltMap } from '@core/map/mapBuild';
import { theme } from '../ui/theme';

/** Destructible mission structure (어설트 기물). Blocks movement and bullets until destroyed. */
export class Objective extends Phaser.GameObjects.Image {
  readonly def: ObjectiveDef;
  readonly maxHp: number;
  hp: number;
  alive = true;
  private bar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    private built: BuiltMap,
    def: ObjectiveDef,
  ) {
    const ts = built.def.tileSize;
    super(scene, (def.at.x + def.size.w / 2) * ts, (def.at.y + def.size.h / 2) * ts, def.tex);
    this.def = def;
    this.maxHp = def.hp;
    this.hp = def.hp;
    this.setDisplaySize(def.size.w * ts, def.size.h * ts).setDepth(7);
    scene.add.existing(this);
    this.bar = scene.add.graphics().setDepth(11);
    this.nameText = scene.add.text(this.x, this.y - (def.size.h * ts) / 2 - 14, '바리케이드', theme.textStyle(11, '#ffd166', { stroke: '#000', strokeThickness: 3 })).setOrigin(0.5).setDepth(11);
    this.drawBar();
  }

  get pos(): Vec2 {
    return { x: this.x, y: this.y };
  }

  /** hit radius for hitscan */
  get radius(): number {
    return (Math.max(this.def.size.w, this.def.size.h) * this.built.def.tileSize) / 2 - 2;
  }

  damage(n: number): boolean {
    if (!this.alive) return false;
    this.hp = Math.max(0, this.hp - n);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => this.alive && this.clearTint());
    this.drawBar();
    if (this.hp <= 0) this.destroyStructure();
    return !this.alive;
  }

  private drawBar(): void {
    this.bar.clear();
    const w = this.displayWidth - 8;
    const x = this.x - w / 2;
    const y = this.y - this.displayHeight / 2 - 6;
    this.bar.fillStyle(0x000000, 0.7).fillRect(x - 1, y - 1, w + 2, 6);
    this.bar.fillStyle(0xffd166, 1).fillRect(x, y, w * (this.hp / this.maxHp), 4);
  }

  private destroyStructure(): void {
    this.alive = false;
    setObjectiveBlocked(this.built, this.def, false);
    this.bar.clear();
    this.nameText.destroy();
    this.clearTint();
    this.scene.cameras.main.shake(150, 0.005);
    this.scene.tweens.add({ targets: this, alpha: 0, scale: this.scale * 0.8, angle: 8, duration: 500, onComplete: () => this.destroy() });
  }

  destroy(fromScene?: boolean): void {
    this.bar.destroy();
    this.nameText.destroy();
    super.destroy(fromScene);
  }
}
