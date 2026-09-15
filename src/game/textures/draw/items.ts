type Ctx = CanvasRenderingContext2D;

const fill = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

function poly(ctx: Ctx, pts: [number, number][], c: string): void {
  ctx.fillStyle = c;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

const iconShadow = (ctx: Ctx, w: number, h: number) => {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 5, w * 0.38, 3, 0, 0, Math.PI * 2);
  ctx.fill();
};

// ---------------------------------------------------------------- weapons (32×32, transparent)

/** Glock 17 — black polymer, squared slide, steep grip */
export function drawIconGlock17(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 4, 10, 22, 6, '#2a2d31'); // slide
  fill(ctx, 4, 10, 22, 1.5, '#4a4e54');
  fill(ctx, 24, 12, 3, 2, '#111'); // muzzle
  fill(ctx, 6, 16, 12, 3, '#1d2023'); // frame
  poly(ctx, [[9, 18], [16, 18], [13, 29], [6, 29]], '#1d2023'); // grip
  fill(ctx, 7, 21, 6, 1, '#3a3d42');
  fill(ctx, 7, 24, 5, 1, '#3a3d42');
  poly(ctx, [[16, 18], [20, 18], [19, 23], [16, 23]], '#1d2023'); // trigger guard
  fill(ctx, 17, 19, 2, 3, '#0a0a0a');
  fill(ctx, 5, 8, 3, 2, '#3a3d42'); // rear sight
  fill(ctx, 22, 8, 2, 2, '#3a3d42'); // front sight
}

/** Colt M1911 — stainless slide, walnut grip, hammer */
export function drawIconM1911(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 4, 10, 22, 6, '#b8bcc2'); // slide
  fill(ctx, 4, 10, 22, 1.5, '#e2e5e9');
  fill(ctx, 4, 15, 22, 1, '#7e8288');
  fill(ctx, 24, 12, 3, 2, '#333');
  fill(ctx, 3, 9, 3, 3, '#7e8288'); // hammer
  fill(ctx, 6, 16, 13, 3, '#9a9ea4'); // frame
  poly(ctx, [[8, 18], [15, 18], [13, 29], [6, 29]], '#5a3a1f'); // wood grip
  fill(ctx, 8, 20, 5, 7, '#7a5230');
  poly(ctx, [[16, 18], [20, 18], [19, 23], [16, 23]], '#9a9ea4');
  fill(ctx, 17, 19, 2, 3, '#0a0a0a');
}

/** H&K MP5 — black, curved magazine, collapsible stock */
export function drawIconMp5(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 1, 13, 7, 2, '#3a3d42'); // stock rail
  fill(ctx, 1, 11, 2, 7, '#3a3d42');
  fill(ctx, 8, 10, 18, 6, '#1f2226'); // receiver
  fill(ctx, 8, 10, 18, 1.5, '#3a3d42');
  fill(ctx, 26, 12, 5, 2, '#111'); // barrel
  fill(ctx, 22, 7, 3, 3, '#3a3d42'); // sight drum
  fill(ctx, 10, 7, 2, 3, '#3a3d42');
  poly(ctx, [[11, 16], [16, 16], [14, 26], [9, 26]], '#1f2226'); // grip
  poly(ctx, [[18, 16], [22, 16], [24, 27], [20, 28]], '#15171a'); // curved mag
  fill(ctx, 22, 16, 5, 2, '#2a2d31'); // handguard
}

/** IMI UZI — boxy receiver, magazine through the grip, folded stock */
export function drawIconUzi(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 6, 9, 20, 8, '#26292d'); // receiver
  fill(ctx, 6, 9, 20, 1.5, '#4a4e54');
  fill(ctx, 26, 12, 4, 2, '#111'); // short barrel
  fill(ctx, 2, 11, 5, 2, '#3a3d42'); // folded stock
  fill(ctx, 2, 11, 2, 6, '#3a3d42');
  fill(ctx, 13, 17, 6, 12, '#1a1c1f'); // grip + mag
  fill(ctx, 14, 18, 1, 10, '#3a3d42');
  fill(ctx, 20, 17, 3, 4, '#26292d'); // trigger guard
  fill(ctx, 9, 7, 2, 2, '#3a3d42');
  fill(ctx, 23, 7, 2, 2, '#3a3d42');
}

/** generic class icons (HUD fallback) */
export const drawIconPistol = drawIconGlock17;
export const drawIconSmg = drawIconMp5;

// ---------------------------------------------------------------- ammo

const ammoBox = (color: string, incendiary: boolean) => (ctx: Ctx, _f: number, w: number, h: number) => {
  iconShadow(ctx, w, h);
  fill(ctx, 4, 9, 24, 17, color);
  fill(ctx, 4, 9, 24, 4, 'rgba(0,0,0,0.3)');
  fill(ctx, 4, 9, 24, 1, 'rgba(255,255,255,0.25)');
  fill(ctx, 7, 15, 18, 8, '#efe9d6'); // label
  for (let i = 0; i < 5; i++) fill(ctx, 8 + i * 3.4, 16, 2, 6, '#c9a227'); // cartridges
  if (incendiary) {
    poly(ctx, [[24, 10], [27, 14], [25, 14], [26, 18], [22, 13], [24, 13]], '#ffb347');
  }
};
export const drawIconAmmoNormal = ammoBox('#556270', false);
export const drawIconAmmoIncendiary = ammoBox('#8a3a1b', true);

// ---------------------------------------------------------------- armor

export function drawIconArmorTop(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[10, 6], [22, 6], [28, 11], [25, 16], [23, 14], [23, 27], [9, 27], [9, 14], [7, 16], [4, 11]], '#6b6f45'); // jacket
  fill(ctx, 13, 6, 6, 4, '#2a2d20'); // collar
  fill(ctx, 15.5, 10, 1, 17, '#3d4030'); // zipper
  fill(ctx, 10, 18, 4, 5, '#5a5e3a'); // pockets
  fill(ctx, 18, 18, 4, 5, '#5a5e3a');
}

export function drawIconArmorBottom(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 8, 5, 16, 5, '#3a3a40'); // waist
  fill(ctx, 8, 5, 16, 1, '#5a5a62');
  poly(ctx, [[8, 10], [15, 10], [14, 28], [7, 28]], '#4a4a52');
  poly(ctx, [[17, 10], [24, 10], [25, 28], [18, 28]], '#4a4a52');
  fill(ctx, 8, 14, 5, 4, '#3d3d45'); // cargo pockets
  fill(ctx, 19, 14, 5, 4, '#3d3d45');
}

// ---------------------------------------------------------------- consumables

export function drawIconBandage(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.fillStyle = '#efece6';
  ctx.beginPath();
  ctx.ellipse(16, 16, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8d3ca';
  ctx.beginPath();
  ctx.ellipse(16, 16, 11, 9, 0, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fill();
  fill(ctx, 14, 9, 4, 14, '#c14a4a');
  fill(ctx, 9, 14, 14, 4, '#c14a4a');
  fill(ctx, 23, 12, 6, 3, '#efece6'); // loose end
}

export function drawIconEnergyDrink(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 10, 5, 12, 22, '#2f6fd1'); // can
  fill(ctx, 10, 5, 12, 2, '#a9c4e8');
  fill(ctx, 10, 25, 12, 2, '#1d4b94');
  fill(ctx, 10, 5, 2, 22, 'rgba(255,255,255,0.25)');
  poly(ctx, [[17, 9], [13, 17], [16, 17], [14, 23], [19, 14], [16, 14]], '#f2c94c'); // bolt
}

export const drawIconConsumable = drawIconBandage;

// ---------------------------------------------------------------- skills

export function drawIconSkillPassive(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 1, 1, w - 2, h - 2, '#262b33');
  ctx.fillStyle = '#c14a4a';
  ctx.beginPath();
  ctx.moveTo(16, 27);
  ctx.bezierCurveTo(2, 16, 8, 5, 16, 11);
  ctx.bezierCurveTo(24, 5, 30, 16, 16, 27);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(11, 12, 3, 2, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawIconSkillMastery(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 1, 1, w - 2, h - 2, '#262b33');
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(16, 16, 4, 0, Math.PI * 2);
  ctx.stroke();
  fill(ctx, 15, 2, 2, 8, '#c9a227');
  fill(ctx, 15, 22, 2, 8, '#c9a227');
  fill(ctx, 2, 15, 8, 2, '#c9a227');
  fill(ctx, 22, 15, 8, 2, '#c9a227');
  drawIconGlock17(ctx, 0, w, h);
}

// ---------------------------------------------------------------- world objects

export function drawPickupWon(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 2, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  fill(ctx, 3, 4, 10, 7, '#3f8a5a'); // banknote
  fill(ctx, 3, 4, 10, 1, '#7bd88f');
  fill(ctx, 6, 6, 4, 3, '#2a6a40');
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(11, 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPickupItem(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 2, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  fill(ctx, 2, 4, 12, 10, '#8b6a3e');
  fill(ctx, 2, 4, 12, 3, '#a8834f');
  fill(ctx, 7, 4, 2, 10, '#5e4526');
}

export function drawCasing(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#c9a227');
  fill(ctx, 0, 0, w, 1, '#e8c85a');
  fill(ctx, w - 2, 0, 2, h, '#8a6a10');
}

export function drawBarricade(ctx: Ctx, _f: number, w: number, h: number): void {
  // stacked sandbags + crossed planks, 2x2 tiles
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(4, h - 12, w - 8, 10);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 15 + (row % 2) * 7;
      const y = 16 + row * 14;
      ctx.fillStyle = row % 2 ? '#8a7a55' : '#9c8b62';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 6, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.ellipse(x + 6, y + 4, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#5a3d1f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(w - 6, h - 8);
  ctx.moveTo(w - 6, 8);
  ctx.lineTo(6, h - 8);
  ctx.stroke();
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(w - 6, h - 8);
  ctx.stroke();
}

export function drawGate(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#2f3439');
  for (let i = 4; i < w; i += 8) fill(ctx, i, 0, 3, h, '#8b939b');
}

export function drawBooth(ctx: Ctx, frame: number, w: number, h: number): void {
  // 이터널시티 부스: kiosk; frames 0..2 = intact → damaged → wrecked
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(6, h - 10, w - 12, 8);
  fill(ctx, 8, 10, w - 16, h - 22, frame === 2 ? '#4a3e3a' : '#2c5f8a');
  fill(ctx, 8, 10, w - 16, 8, '#c9a227');
  fill(ctx, 14, 24, w - 28, 14, frame === 0 ? '#bfe3ff' : '#6b7d8a');
  if (frame >= 1) {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 28);
    ctx.lineTo(30, 40);
    ctx.lineTo(26, 50);
    ctx.stroke();
  }
  if (frame === 2) fill(ctx, 10, 14, 18, 6, '#7a2e2e');
}
