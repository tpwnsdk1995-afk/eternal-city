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

/** M16A2 — long black rifle with carry handle and triangular front sight */
export function drawIconM16(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 1, 12, 8, 4, '#2a2d31'); // stock
  fill(ctx, 8, 10, 16, 6, '#1f2226'); // receiver
  fill(ctx, 10, 7, 9, 3, '#2a2d31'); // carry handle
  fill(ctx, 24, 12, 7, 2.5, '#111'); // barrel
  poly(ctx, [[27, 12], [29, 12], [28, 8]], '#3a3d42'); // front sight
  poly(ctx, [[12, 16], [16, 16], [15, 24], [11, 24]], '#1f2226'); // grip
  poly(ctx, [[17, 16], [21, 16], [20, 27], [16, 27]], '#15171a'); // magazine
  fill(ctx, 21, 16, 5, 2, '#2a2d31'); // handguard
}

/** AK-47 — wooden stock/handguard, curved magazine */
export function drawIconAk47(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[1, 11], [8, 12], [8, 16], [1, 17]], '#6b4a2e'); // wood stock
  fill(ctx, 8, 10, 14, 6, '#26292d');
  fill(ctx, 8, 10, 14, 1.5, '#4a4e54');
  fill(ctx, 22, 11, 4, 4, '#6b4a2e'); // wood handguard
  fill(ctx, 26, 12, 5, 2.5, '#111');
  fill(ctx, 27, 8, 1.5, 4, '#3a3d42'); // gas block / sight
  poly(ctx, [[11, 16], [15, 16], [14, 24], [10, 24]], '#6b4a2e'); // grip
  poly(ctx, [[16, 16], [20, 16], [23, 27], [19, 28]], '#15171a'); // curved mag
}

/** Pump shotgun — long barrel + tube, wooden stock */
export function drawIconShotgun(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[1, 12], [9, 12], [9, 17], [1, 19]], '#6b4a2e'); // stock
  fill(ctx, 9, 11, 8, 6, '#26292d'); // receiver
  fill(ctx, 17, 11, 14, 2.5, '#3a3d42'); // barrel
  fill(ctx, 17, 14, 12, 2.5, '#6b4a2e'); // pump / tube
  fill(ctx, 12, 17, 3, 3, '#26292d'); // trigger guard
  fill(ctx, 30, 10, 1.5, 2, '#c9a227'); // bead sight
}

/** Bolt sniper rifle — scope, long barrel, bipod */
export function drawIconSniper(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[1, 13], [9, 13], [9, 17], [1, 19]], '#2f3a2a'); // synthetic stock
  fill(ctx, 9, 12, 12, 5, '#26292d');
  fill(ctx, 21, 13, 10, 2, '#3a3d42'); // barrel
  fill(ctx, 11, 8, 10, 3, '#1f2226'); // scope
  fill(ctx, 10, 7.5, 2, 4, '#3a3d42');
  fill(ctx, 20, 7.5, 2, 4, '#3a3d42');
  fill(ctx, 13, 17, 3, 5, '#26292d'); // magazine
  fill(ctx, 24, 15, 1.5, 6, '#4a4e54'); // bipod
  fill(ctx, 28, 15, 1.5, 6, '#4a4e54');
}

/** Belt-fed machine gun — thick body, bipod, ammo box */
export function drawIconMg(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 1, 12, 7, 5, '#2a2d31');
  fill(ctx, 8, 9, 15, 8, '#1f2226'); // receiver
  fill(ctx, 8, 9, 15, 1.5, '#4a4e54');
  fill(ctx, 23, 11, 8, 3, '#3a3d42'); // barrel
  fill(ctx, 23, 10, 6, 1, '#6b7077'); // heat shield
  fill(ctx, 11, 17, 8, 7, '#4a5530'); // ammo box
  fill(ctx, 11, 17, 8, 1.5, '#5a6540');
  fill(ctx, 25, 14, 1.5, 7, '#4a4e54');
  fill(ctx, 29, 14, 1.5, 7, '#4a4e54');
  for (let i = 0; i < 4; i++) fill(ctx, 19 + i * 1.6, 15, 1, 3, '#c9a227'); // belt
}

/** Police baton */
export function drawIconBaton(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-Math.PI / 4);
  fill(ctx, -12, -2, 24, 4, '#1f2226');
  fill(ctx, -12, -2, 24, 1, '#3a3d42');
  fill(ctx, -12, -3, 8, 6, '#4a4e54'); // grip
  fill(ctx, -6, -4, 2, 8, '#2a2d31'); // side handle
  ctx.restore();
}

/** Machete */
export function drawIconMachete(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-Math.PI / 4);
  poly(ctx, [[-4, -3], [13, -3], [15, 0], [12, 3], [-4, 3]], '#b8bcc2'); // blade
  fill(ctx, -4, -3, 17, 1, '#e2e5e9');
  fill(ctx, -12, -2.5, 8, 5, '#3a2a1a'); // handle
  ctx.restore();
}

/** Fire axe */
export function drawIconAxe(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-Math.PI / 4);
  fill(ctx, -13, -1.5, 22, 3, '#6b4a2e'); // haft
  poly(ctx, [[6, -8], [13, -5], [13, 5], [6, 8], [8, 0]], '#c8402a'); // head
  poly(ctx, [[11, -5], [13, -5], [13, 5], [11, 5]], '#e2e5e9'); // edge
  poly(ctx, [[6, -1.5], [2, -4], [2, 4], [6, 1.5]], '#c8402a'); // pick
  ctx.restore();
}

/** Grenade launcher / RPG — short fat tube */
export function drawIconLauncher(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[1, 13], [8, 13], [8, 17], [1, 19]], '#6b4a2e');
  fill(ctx, 8, 10, 20, 7, '#4a5530'); // tube
  fill(ctx, 8, 10, 20, 1.5, '#6b7a48');
  fill(ctx, 26, 9, 5, 9, '#3a3d42'); // muzzle bell
  fill(ctx, 12, 17, 3, 6, '#26292d'); // grip
  fill(ctx, 14, 6, 6, 3, '#26292d'); // sight
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
export const drawIconAmmoAp = (ctx: Ctx, f: number, w: number, h: number) => {
  ammoBox('#2f3f5c', false)(ctx, f, w, h);
  for (let i = 0; i < 5; i++) fill(ctx, 8 + i * 3.4, 16, 2, 2, '#1a1a1a'); // black tips
};

/** shotgun shells: red hulls with brass bases */
export function drawIconAmmoShell(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 4, 9, 24, 17, '#5a4a3a');
  fill(ctx, 4, 9, 24, 4, 'rgba(0,0,0,0.3)');
  for (let i = 0; i < 5; i++) {
    fill(ctx, 7 + i * 4, 14, 3, 9, '#c8402a');
    fill(ctx, 7 + i * 4, 21, 3, 3, '#c9a227');
  }
}
export const drawIconAmmoSlug = (ctx: Ctx, f: number, w: number, h: number) => {
  drawIconAmmoShell(ctx, f, w, h);
  for (let i = 0; i < 5; i++) fill(ctx, 7 + i * 4, 14, 3, 9, '#2a5a2a');
};

/** 40mm grenades in a crate */
export function drawIconAmmoGrenade(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 4, 9, 24, 17, '#4a5530');
  fill(ctx, 4, 9, 24, 4, 'rgba(0,0,0,0.3)');
  for (let i = 0; i < 3; i++) {
    fill(ctx, 7 + i * 7, 14, 5, 9, '#c9a227');
    fill(ctx, 7 + i * 7, 14, 5, 3, '#7a5d10');
  }
}

/** RPG rocket */
export function drawIconAmmoRocket(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-Math.PI / 4);
  fill(ctx, -12, -2, 18, 4, '#4a5530'); // body
  poly(ctx, [[6, -4], [13, 0], [6, 4]], '#6b7a48'); // warhead
  poly(ctx, [[-12, -2], [-16, -5], [-12, 0]], '#3a3d42'); // fins
  poly(ctx, [[-12, 2], [-16, 5], [-12, 0]], '#3a3d42');
  ctx.restore();
}

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

/** Orange pill bottle */
export function drawIconPainkiller(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 11, 8, 10, 4, '#f4f4f4'); // cap
  fill(ctx, 10, 12, 12, 15, '#e08a2a');
  fill(ctx, 10, 12, 2, 15, 'rgba(255,255,255,0.3)');
  fill(ctx, 12, 16, 8, 7, '#f7f0dc'); // label
  fill(ctx, 13, 18, 6, 1.2, '#c23b3b');
  fill(ctx, 13, 20.5, 4, 1.2, '#6b6f7a');
}

/** Folded military document with a red classification stamp */
export function drawIconDocument(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[7, 4], [21, 4], [26, 9], [26, 28], [7, 28]], '#e8e2d2');
  poly(ctx, [[21, 4], [21, 9], [26, 9]], '#b8b2a2');
  for (let y = 12; y < 26; y += 3.5) fill(ctx, 10, y, y % 7 < 3.5 ? 12 : 9, 1.2, '#6b6f7a');
  ctx.strokeStyle = '#c23b3b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12.5, 17.5, 10, 6);
  fill(ctx, 14, 19.5, 7, 2, '#c23b3b');
}

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

// ---------------------------------------------------------------- armor (M3-6: 코트 · 신발 · 모자 · 가발)

export function drawIconArmorCoat(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[9, 5], [23, 5], [29, 10], [27, 15], [24, 13], [25, 29], [7, 29], [8, 13], [5, 15], [3, 10]], '#3b3f4a'); // long coat
  poly(ctx, [[13, 5], [16, 12], [19, 5]], '#1f2229'); // lapels
  fill(ctx, 15.5, 12, 1, 17, '#22252c');
  fill(ctx, 9, 20, 5, 4, '#2f333c'); // pockets
  fill(ctx, 18, 20, 5, 4, '#2f333c');
  fill(ctx, 14, 14, 1, 1, '#c9a227'); // buttons
  fill(ctx, 14, 18, 1, 1, '#c9a227');
}

export function drawIconArmorShoes(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[5, 16], [12, 12], [15, 14], [15, 24], [4, 24], [3, 20]], '#3a2a1f'); // left boot
  poly(ctx, [[17, 16], [24, 12], [27, 14], [29, 20], [28, 24], [17, 24]], '#3a2a1f'); // right boot
  fill(ctx, 3, 22, 12, 3, '#1a1512'); // soles
  fill(ctx, 17, 22, 12, 3, '#1a1512');
  fill(ctx, 11, 13, 2, 8, '#8a6a3a'); // laces
  fill(ctx, 23, 13, 2, 8, '#8a6a3a');
}

export function drawIconArmorHat(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.fillStyle = '#2c3a2a';
  ctx.beginPath();
  ctx.ellipse(16, 20, 13, 4, 0, 0, Math.PI * 2); // brim
  ctx.fill();
  ctx.fillStyle = '#3d4f3a';
  ctx.beginPath();
  ctx.ellipse(16, 14, 8, 6, 0, Math.PI, 0); // dome
  ctx.fill();
  fill(ctx, 8, 14, 16, 5, '#3d4f3a');
  fill(ctx, 8, 17, 16, 2, '#1f2a1e'); // band
}

export function drawIconArmorWig(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.fillStyle = '#5a3a8a';
  ctx.beginPath();
  ctx.ellipse(16, 13, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  poly(ctx, [[7, 13], [6, 27], [11, 26], [11, 15]], '#5a3a8a'); // side locks
  poly(ctx, [[25, 13], [26, 27], [21, 26], [21, 15]], '#5a3a8a');
  fill(ctx, 11, 15, 10, 9, '#f1c9a5'); // face gap
  fill(ctx, 9, 8, 14, 2, 'rgba(255,255,255,0.25)'); // sheen
}

export function drawIconSkillActive(ctx: Ctx, _f: number, w: number, h: number): void {
  fill(ctx, 0, 0, w, h, '#1d2126');
  fill(ctx, 1, 1, w - 2, h - 2, '#262b33');
  poly(ctx, [[18, 3], [8, 18], [15, 18], [13, 29], [24, 13], [17, 13]], '#3b7bc2'); // lightning bolt (행동력)
  poly(ctx, [[18, 3], [8, 18], [15, 18], [15, 15], [12, 15]], 'rgba(255,255,255,0.25)');
}

// ---------------------------------------------------------------- 사이버샵

export function drawIconHpPack(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 7, 6, 18, 22, '#c9c9cf'); // IV bag
  fill(ctx, 9, 8, 14, 14, '#c23b3b');
  fill(ctx, 9, 8, 14, 5, 'rgba(255,255,255,0.25)');
  fill(ctx, 14, 3, 4, 3, '#8a8a90');
  fill(ctx, 15, 22, 2, 8, '#d9d9df'); // tube
  fill(ctx, 12, 12, 8, 2, '#ffffff'); // cross
  fill(ctx, 15, 9, 2, 8, '#ffffff');
}

export function drawIconSyringe(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-Math.PI / 4);
  fill(ctx, -10, -3, 16, 6, '#dfe6ee'); // barrel
  fill(ctx, -9, -2, 9, 4, '#7bd88f'); // fluid
  fill(ctx, 6, -1, 8, 2, '#9aa0a6'); // needle
  fill(ctx, -14, -5, 4, 10, '#6b7280'); // plunger cap
  fill(ctx, -12, -1, 3, 2, '#9aa0a6');
  ctx.restore();
}

export function drawIconLens(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.stroke();
  const g = ctx.createRadialGradient(13, 13, 1, 16, 16, 9);
  g.addColorStop(0, 'rgba(180,230,255,0.9)');
  g.addColorStop(1, 'rgba(40,90,160,0.8)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(16, 16, 8, 0, Math.PI * 2);
  ctx.fill();
  fill(ctx, 15, 6, 2, 20, 'rgba(255,255,255,0.35)');
  fill(ctx, 6, 15, 20, 2, 'rgba(255,255,255,0.35)');
}

export function drawIconAmpoule(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  poly(ctx, [[13, 4], [19, 4], [18, 9], [22, 13], [22, 27], [10, 27], [10, 13], [14, 9]], '#e8eef5'); // glass
  fill(ctx, 11, 16, 10, 10, '#3b7bc2'); // fluid
  fill(ctx, 11, 16, 10, 3, 'rgba(255,255,255,0.3)');
  fill(ctx, 14, 4, 4, 2, '#9aa0a6'); // neck
  fill(ctx, 12, 12, 2, 10, 'rgba(255,255,255,0.45)'); // shine
}

export function drawIconTicket(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-0.3);
  fill(ctx, -13, -7, 26, 14, '#c9a227');
  fill(ctx, -12, -6, 24, 12, '#e8c85a');
  for (let i = -10; i <= 10; i += 4) fill(ctx, i, -8, 2, 2, '#1d2126');
  for (let i = -10; i <= 10; i += 4) fill(ctx, i, 6, 2, 2, '#1d2126');
  fill(ctx, -9, -2, 18, 1, '#7a5a10');
  fill(ctx, -9, 1, 12, 1, '#7a5a10');
  fill(ctx, 3, 0, 5, 3, '#c23b3b'); // stamp
  ctx.restore();
}

export function drawIconCoupon(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  fill(ctx, 4, 8, 24, 16, '#2b2f3a');
  fill(ctx, 5, 9, 22, 14, '#3b4a7a');
  fill(ctx, 5, 9, 22, 4, '#c9a227'); // band
  fill(ctx, 8, 15, 10, 2, '#ffffff');
  fill(ctx, 8, 19, 14, 1, '#9aa0a6');
  // star
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 1.5 : 3.5;
    ctx.lineTo(23 + Math.cos(a) * r, 17 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------- 변이무기 (감염체)

export function drawIconClaws(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.fillStyle = '#a7b89a';
  ctx.beginPath();
  ctx.ellipse(16, 22, 8, 6, 0, 0, Math.PI * 2); // hand
  ctx.fill();
  ctx.strokeStyle = '#e8e2c8';
  ctx.lineWidth = 2.2;
  for (const [x0, x1] of [[10, 5], [14, 12], [18, 19], [22, 26]]) {
    ctx.beginPath();
    ctx.moveTo(x0, 19);
    ctx.lineTo(x1, 5);
    ctx.stroke();
  }
}

export function drawIconTentacle(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.strokeStyle = '#7a5a8a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(6, 27);
  ctx.bezierCurveTo(4, 14, 18, 20, 20, 12);
  ctx.bezierCurveTo(22, 6, 27, 6, 27, 4);
  ctx.stroke();
  ctx.strokeStyle = '#b48ac0';
  ctx.lineWidth = 1.5;
  for (const [x, y] of [[8, 22], [12, 18], [18, 15], [22, 10]]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawIconAcid(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.fillStyle = '#7bd83f';
  ctx.beginPath();
  ctx.moveTo(16, 4);
  ctx.bezierCurveTo(6, 16, 8, 27, 16, 27);
  ctx.bezierCurveTo(24, 27, 26, 16, 16, 4);
  ctx.fill();
  fill(ctx, 12, 12, 3, 8, 'rgba(255,255,255,0.35)');
  for (const [x, y, r] of [[6, 9, 2], [26, 12, 1.5], [24, 24, 2]]) {
    ctx.fillStyle = '#a8f060';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawIconBone(ctx: Ctx, _f: number, w: number, h: number): void {
  iconShadow(ctx, w, h);
  ctx.save();
  ctx.translate(16, 16);
  ctx.rotate(-Math.PI / 4);
  poly(ctx, [[-12, -2], [10, -3], [14, 0], [10, 3], [-12, 2]], '#e8e2c8'); // blade
  fill(ctx, -12, -1, 22, 1, 'rgba(255,255,255,0.4)');
  fill(ctx, -15, -3, 4, 6, '#7a6a5a'); // knuckle grip
  ctx.restore();
}

/** 패러사이트 뿌리 기물: pulsing organic mass with tendrils, 2×2 tiles. */
export function drawRootNode(ctx: Ctx, _f: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 8, w * 0.42, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a2a4a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.6);
    ctx.quadraticCurveTo(w / 2 + Math.cos(a) * 18, h * 0.6 + Math.sin(a) * 12, w / 2 + Math.cos(a) * 30, h * 0.6 + Math.sin(a) * 20);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(w / 2, h * 0.5, 3, w / 2, h * 0.5, 22);
  g.addColorStop(0, '#ff5a9a');
  g.addColorStop(0.5, '#8a2a5a');
  g.addColorStop(1, '#3a1030');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.5, 20, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(w / 2 - 6, h * 0.4, 5, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();
}
