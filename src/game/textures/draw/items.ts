type Ctx = CanvasRenderingContext2D;

const fill = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

export function drawIconPistol(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 6, 12, 20, 5, '#c8ccd2'); // barrel/slide
  fill(ctx, 8, 17, 8, 3, '#8b9096'); // frame
  fill(ctx, 10, 19, 5, 9, '#5c6167'); // grip
  fill(ctx, 16, 17, 3, 4, '#3a3f45'); // trigger guard
}

export function drawIconSmg(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 3, 12, 26, 5, '#b8bcc2');
  fill(ctx, 6, 17, 14, 3, '#7d8288');
  fill(ctx, 14, 19, 4, 10, '#4f545a'); // magazine
  fill(ctx, 8, 19, 4, 6, '#4f545a'); // grip
  fill(ctx, 3, 9, 3, 3, '#7d8288'); // sight
}

const ammoBox = (color: string) => (ctx: Ctx, _f: number, w: number, h: number) => {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 4, 8, 24, 18, color);
  fill(ctx, 4, 8, 24, 5, 'rgba(0,0,0,0.3)');
  fill(ctx, 8, 15, 16, 7, 'rgba(255,255,255,0.85)');
  for (let i = 0; i < 4; i++) fill(ctx, 9 + i * 4, 16, 2, 5, '#c9a227');
};
export const drawIconAmmoNormal = ammoBox('#556270');
export const drawIconAmmoIncendiary = ammoBox('#b5451b');

export function drawIconArmorTop(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 6, 8, 20, 18, '#6b6f45');
  fill(ctx, 2, 8, 6, 8, '#6b6f45');
  fill(ctx, 24, 8, 6, 8, '#6b6f45');
  fill(ctx, 13, 8, 6, 4, '#1d2126');
}

export function drawIconArmorBottom(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 8, 6, 16, 8, '#4a4a4f');
  fill(ctx, 8, 14, 7, 14, '#4a4a4f');
  fill(ctx, 17, 14, 7, 14, '#4a4a4f');
}

export function drawIconSkillPassive(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  ctx.fillStyle = '#c14a4a';
  ctx.beginPath();
  ctx.moveTo(16, 27);
  ctx.bezierCurveTo(2, 16, 8, 5, 16, 11);
  ctx.bezierCurveTo(24, 5, 30, 16, 16, 27);
  ctx.fill();
}

export function drawIconSkillMastery(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(16, 16, 4, 0, Math.PI * 2);
  ctx.stroke();
  fill(ctx, 15, 2, 2, 28, '#c9a227');
  fill(ctx, 2, 15, 28, 2, '#c9a227');
}

export function drawIconConsumable(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 8, 6, 16, 20, '#e8e6ef');
  fill(ctx, 13, 10, 6, 12, '#c14a4a');
  fill(ctx, 10, 13, 12, 6, '#c14a4a');
}

export function drawPickupWon(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a5d10';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₩', w / 2, h / 2 + 0.5);
}

export function drawPickupItem(ctx: Ctx, _f: number, _w: number, _h: number): void {
  fill(ctx, 2, 4, 12, 10, '#8b6a3e');
  fill(ctx, 2, 4, 12, 3, '#a8834f');
  fill(ctx, 7, 4, 2, 10, '#5e4526');
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
}

export function drawGate(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#2f3439');
  for (let i = 4; i < w; i += 8) fill(ctx, i, 0, 3, h, '#8b939b');
}

export function drawBooth(ctx: Ctx, frame: number, w: number, h: number): void {
  // 이터널시티 부스: kiosk; frames 0..2 = intact → damaged → wrecked
  fill(ctx, 0, 0, w, h, 'rgba(0,0,0,0)');
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
  if (frame === 2) {
    fill(ctx, 10, 14, 18, 6, '#7a2e2e');
  }
}
