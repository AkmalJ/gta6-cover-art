// Vice Panels renderer: draws a multi-panel, GTA-poster-style cover onto a 2D canvas context.
//
// A cover is a set of photo panels cut by diagonal seams, washed with a colour grade, finished
// with a vignette and grain, and captioned with heavy condensed lettering. Everything here is
// original: the layouts, the grades and the badge motif are drawn in code, no borrowed art.
//
// Panel state: { img, zoom, x, y } — img is an Image or null, zoom >= 1 multiplies the cover-fit
// scale, and x/y slide the photo inside its panel (-1..1, as a fraction of the spare room).

export const LAYOUTS = {
  triptych: { label: 'Triptych', panels: 3 },
  hero: { label: 'Hero + Strips', panels: 3 },
  quad: { label: 'Quad', panels: 4 },
};

export const GRADES = {
  sunset: { label: 'Vice Sunset' },
  neon: { label: 'Neon Nights' },
  golden: { label: 'Golden Hour' },
  midnight: { label: 'Midnight Chrome' },
};

/** Panel polygons for a layout, as [x, y] points in unit space (multiply by W and H). */
export function panelPolygons(layout) {
  switch (layout) {
    case 'hero':
      return [
        [[0, 0], [1, 0], [1, 0.585], [0, 0.655]],
        [[0, 0.672], [0.525, 0.63], [0.478, 1], [0, 1]],
        [[0.542, 0.627], [1, 0.6], [1, 1], [0.495, 1]],
      ];
    case 'quad':
      return [
        [[0, 0], [0.525, 0], [0.482, 0.485], [0, 0.53]],
        [[0.542, 0], [1, 0], [1, 0.515], [0.5, 0.487]],
        [[0, 0.548], [0.468, 0.503], [0.505, 1], [0, 1]],
        [[0.485, 0.503], [1, 0.533], [1, 1], [0.522, 1]],
      ];
    default: // triptych: three uprights, each leaning on a diagonal seam
      return [
        [[0, 0], [0.362, 0], [0.298, 1], [0, 1]],
        [[0.378, 0], [0.7, 0], [0.636, 1], [0.314, 1]],
        [[0.716, 0], [1, 0], [1, 1], [0.652, 1]],
      ];
  }
}

function tracePath(ctx, poly, W, H) {
  ctx.beginPath();
  poly.forEach(([px, py], i) => {
    if (i === 0) ctx.moveTo(px * W, py * H);
    else ctx.lineTo(px * W, py * H);
  });
  ctx.closePath();
}

/** Draws one panel: clip to its polygon, then lay the photo down cover-fit with zoom and slide. */
function drawPanel(ctx, poly, panel, W, H, grade) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const bx = Math.min(...xs) * W;
  const by = Math.min(...ys) * H;
  const bw = (Math.max(...xs) - Math.min(...xs)) * W;
  const bh = (Math.max(...ys) - Math.min(...ys)) * H;
  ctx.save();
  tracePath(ctx, poly, W, H);
  ctx.clip();
  if (panel && panel.img) {
    const img = panel.img;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(bw / iw, bh / ih) * (panel.zoom || 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = bx + (bw - dw) / 2 + (panel.x || 0) * (dw - bw) * 0.5;
    const dy = by + (bh - dh) / 2 + (panel.y || 0) * (dh - bh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    // An empty panel still has to look designed: a deep grade wash and a faint diamond.
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, grade.empty[0]);
    g.addColorStop(1, grade.empty[1]);
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255, 235, 200, 0.35)';
    ctx.lineWidth = Math.max(2, W * 0.0035);
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const r = Math.min(bw, bh) * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
  // The seam: a hard dark keyline with a hair of warm light on top, like cut paper edges.
  tracePath(ctx, poly, W, H);
  ctx.strokeStyle = 'rgba(10, 4, 18, 0.9)';
  ctx.lineWidth = Math.max(3, W * 0.007);
  ctx.stroke();
  tracePath(ctx, poly, W, H);
  ctx.strokeStyle = 'rgba(255, 240, 214, 0.55)';
  ctx.lineWidth = Math.max(1, W * 0.0016);
  ctx.stroke();
}

const GRADE_WASH = {
  sunset: {
    stops: [[0, 'rgba(43, 10, 77, 0.55)'], [0.45, 'rgba(146, 24, 118, 0.18)'], [0.78, 'rgba(255, 94, 58, 0.28)'], [1, 'rgba(255, 138, 61, 0.5)']],
    glow: 'rgba(255, 110, 64, 0.20)',
    empty: ['#3a1159', '#8f1d5f'],
  },
  neon: {
    stops: [[0, 'rgba(2, 32, 54, 0.5)'], [0.5, 'rgba(10, 90, 110, 0.16)'], [1, 'rgba(255, 43, 133, 0.42)']],
    glow: 'rgba(24, 224, 208, 0.16)',
    empty: ['#06324a', '#7a1e5e'],
  },
  golden: {
    stops: [[0, 'rgba(58, 26, 4, 0.42)'], [0.55, 'rgba(190, 110, 20, 0.15)'], [1, 'rgba(255, 176, 66, 0.48)']],
    glow: 'rgba(255, 190, 80, 0.22)',
    empty: ['#4a2408', '#9c5a14'],
  },
  midnight: {
    stops: [[0, 'rgba(4, 10, 34, 0.58)'], [0.55, 'rgba(38, 64, 140, 0.18)'], [1, 'rgba(148, 178, 255, 0.34)']],
    glow: 'rgba(140, 170, 255, 0.15)',
    empty: ['#0a1434', '#33509c'],
  },
};

/** The colour grade: a soft-light wash, a low overlay pass, and a warm glow off the foot. */
function applyGrade(ctx, W, H, name) {
  const grade = GRADE_WASH[name] || GRADE_WASH.sunset;
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, colour] of grade.stops) wash.addColorStop(at, colour);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const glow = ctx.createRadialGradient(W / 2, H * 1.05, H * 0.1, W / 2, H * 1.05, H * 0.95);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

/** Vignette to seat the art, darker at the corners than the middle of any edge. */
function applyVignette(ctx, W, H) {
  const r = Math.hypot(W, H) * 0.62;
  const v = ctx.createRadialGradient(W / 2, H / 2, r * 0.42, W / 2, H / 2, r);
  v.addColorStop(0, 'rgba(5, 2, 10, 0)');
  v.addColorStop(1, 'rgba(5, 2, 10, 0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

let grainTile = null;
function applyGrain(ctx, W, H) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 140;
    grainTile.height = 140;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(140, 140);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 96 + Math.floor(Math.random() * 96);
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.07;
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

const FONT_STACK = `'Arial Narrow', 'Liberation Sans Narrow', 'Helvetica Neue', Arial, sans-serif`;

/** Fits the caption size down until the words sit inside `maxWidth`. */
function fitSize(ctx, text, weight, start, maxWidth) {
  let size = start;
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size *= 0.94;
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  }
  return size;
}

/** The small original badge: a gold diamond ring holding a four-point star, centred up top. */
function drawBadge(ctx, W, H) {
  const cx = W / 2;
  const cy = H * 0.058;
  const r = Math.min(W, H) * 0.031;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffd98a';
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  const s = r * 0.52;
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.18, -s * 0.18, s, 0);
  ctx.quadraticCurveTo(s * 0.18, s * 0.18, 0, s);
  ctx.quadraticCurveTo(-s * 0.18, s * 0.18, -s, 0);
  ctx.quadraticCurveTo(-s * 0.18, -s * 0.18, 0, -s);
  ctx.fill();
  ctx.restore();
}

/** Caption block at the foot: subtitle in spaced capitals, then the big stretched headline. */
function drawCaption(ctx, W, H, caption, subtitle) {
  const cap = (caption || '').trim().toUpperCase();
  const sub = (subtitle || '').trim().toUpperCase();
  if (!cap && !sub) return;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let baseline = H * 0.955;
  if (cap) {
    const size = fitSize(ctx, cap, 900, H * 0.135, W * 0.92);
    ctx.font = `900 ${size}px ${FONT_STACK}`;
    // Hard offset shadow first (no blur — a printed poster shadow, not a glow).
    ctx.save();
    ctx.translate(W / 2, baseline);
    ctx.transform(1, 0, 0, 1.16, 0, 0);
    ctx.fillStyle = '#1c0530';
    ctx.fillText(cap, size * 0.045, size * 0.055);
    ctx.lineWidth = size * 0.17;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#12041f';
    ctx.strokeText(cap, 0, 0);
    const fill = ctx.createLinearGradient(0, -size, 0, size * 0.25);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.72, '#ffeecf');
    fill.addColorStop(1, '#ffc98a');
    ctx.fillStyle = fill;
    ctx.fillText(cap, 0, 0);
    ctx.restore();
    baseline -= size * 1.3;
  }
  if (sub) {
    const size = fitSize(ctx, sub, 700, H * 0.037, W * 0.8);
    ctx.font = `700 ${size}px ${FONT_STACK}`;
    try { ctx.letterSpacing = `${Math.round(size * 0.42)}px`; } catch { /* older engines */ }
    ctx.save();
    ctx.translate(W / 2, baseline);
    ctx.fillStyle = 'rgba(10, 3, 18, 0.85)';
    ctx.fillText(sub, size * 0.05, size * 0.06);
    ctx.fillStyle = '#ffd98a';
    ctx.fillText(sub, 0, 0);
    ctx.restore();
    try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
  }
}

/**
 * Renders a whole cover. `state` = { layout, grade, caption, subtitle, panels }.
 * The canvas's own width/height set the export size; nothing here knows about the page.
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADE_WASH[state.grade] || GRADE_WASH.sunset;
  ctx.fillStyle = '#150722';
  ctx.fillRect(0, 0, W, H);
  const polys = panelPolygons(state.layout);
  polys.forEach((poly, i) => drawPanel(ctx, poly, state.panels[i], W, H, grade));
  applyGrade(ctx, W, H, state.grade);
  applyVignette(ctx, W, H);
  applyGrain(ctx, W, H);
  drawBadge(ctx, W, H);
  drawCaption(ctx, W, H, state.caption, state.subtitle);
}
