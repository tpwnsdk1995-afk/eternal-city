type Ctx = CanvasRenderingContext2D;

/** 1280×720 night-time Seoul skyline for the title / character-create screens. */
export function drawTitleBackground(ctx: Ctx, _f: number, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05070c');
  sky.addColorStop(0.55, '#0c1220');
  sky.addColorStop(0.8, '#1a1418');
  sky.addColorStop(1, '#2a1a12');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // haze over the horizon
  const haze = ctx.createRadialGradient(w * 0.55, h * 0.72, 20, w * 0.55, h * 0.72, w * 0.6);
  haze.addColorStop(0, 'rgba(180,90,40,0.28)');
  haze.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);

  let s = 17;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // far skyline (dark), then near skyline (darker with lit windows)
  const layer = (baseY: number, minH: number, maxH: number, color: string, windows: boolean) => {
    let x = -20;
    while (x < w + 40) {
      const bw = 30 + rnd() * 70;
      const bh = minH + rnd() * (maxH - minH);
      ctx.fillStyle = color;
      ctx.fillRect(x, baseY - bh, bw, bh);
      if (rnd() < 0.3) ctx.fillRect(x + bw * 0.3, baseY - bh - 14, bw * 0.4, 14); // rooftop box
      if (rnd() < 0.15) {
        ctx.fillStyle = '#c23b3b';
        ctx.fillRect(x + bw / 2 - 1, baseY - bh - 22, 2, 8); // antenna light
      }
      if (windows) {
        for (let wy = baseY - bh + 8; wy < baseY - 10; wy += 11) {
          for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
            if (rnd() < 0.45) {
              ctx.fillStyle = rnd() < 0.8 ? 'rgba(255,220,150,0.55)' : 'rgba(150,200,255,0.5)';
              ctx.fillRect(wx, wy, 4, 5);
            }
          }
        }
      }
      x += bw + 4 + rnd() * 10;
    }
  };
  layer(h * 0.74, 60, 200, '#0e1219', false);
  layer(h * 0.8, 40, 150, '#090b10', true);

  // street level: wet asphalt with reflections
  const road = ctx.createLinearGradient(0, h * 0.8, 0, h);
  road.addColorStop(0, '#15171b');
  road.addColorStop(1, '#0a0b0d');
  ctx.fillStyle = road;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);
  for (let i = 0; i < 40; i++) {
    const rx = rnd() * w;
    const ry = h * 0.82 + rnd() * h * 0.16;
    ctx.fillStyle = `rgba(255,${180 + Math.floor(rnd() * 60)},120,${0.05 + rnd() * 0.08})`;
    ctx.fillRect(rx, ry, 2 + rnd() * 30, 1);
  }

  // two street lamps with cones
  for (const lx of [w * 0.18, w * 0.83]) {
    ctx.fillStyle = '#2a2d33';
    ctx.fillRect(lx - 2, h * 0.5, 4, h * 0.32);
    ctx.fillRect(lx - 2, h * 0.5, 30, 3);
    const cone = ctx.createRadialGradient(lx + 28, h * 0.52, 2, lx + 28, h * 0.52, 140);
    cone.addColorStop(0, 'rgba(255,235,170,0.45)');
    cone.addColorStop(1, 'rgba(255,235,170,0)');
    ctx.fillStyle = cone;
    ctx.fillRect(lx - 120, h * 0.4, 300, 300);
  }

  // vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
