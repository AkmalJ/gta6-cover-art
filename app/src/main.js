// Vice Panels editor: wires the control rail to the renderer in ./cover.js.
//
// The flow is deliberately short: photos land in one of four slots, a click on a panel drops the
// selected photo into it, dragging slides the photo inside its panel, and Export renders the
// whole cover offscreen at the chosen print size. A `?shot=` query hands control to ./shots.js,
// which stages fixed scenes for the screenshots instead.
import { renderCover, panelPolygons, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const state = {
  layout: 'triptych',
  grade: 'emerald',
  caption: 'VICE HEAT',
  subtitle: 'ONE LAST SCORE',
  size: '1080x1080',
  panels: [0, 1, 2, 3].map(() => ({ img: null, zoom: 1, x: 0, y: 0 })),
};

const photos = [null, null, null, null];
let selectedPhoto = 0;
let selectedPanel = 0;

const canvas = document.getElementById('stage');
const status = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function previewDims() {
  const [w, h] = SIZES[state.size];
  const scale = Math.min(740 / w, 740 / h);
  return [Math.round(w * scale), Math.round(h * scale)];
}

export function redraw() {
  const [w, h] = previewDims();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  renderCover(canvas, state);
}

/** Renders straight onto the visible canvas at an exact size (used by screenshot scenes). */
export function redrawAt(w, h) {
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, state);
}

function say(text) {
  status.textContent = text;
}

/* ---------- photos ---------- */

const slotEls = [...document.querySelectorAll('.slot')];

function paintSlots() {
  slotEls.forEach((el, i) => {
    el.classList.toggle('picked', i === selectedPhoto);
    el.classList.toggle('filled', Boolean(photos[i]));
    const img = el.querySelector('img');
    if (photos[i]) {
      img.src = photos[i].src;
      img.style.display = 'block';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
  });
}

async function putPhoto(index, url) {
  photos[index] = await loadImage(url);
  selectedPhoto = index;
  paintSlots();
  say(`Photo ${index + 1} loaded — click a panel to place it.`);
}

slotEls.forEach((el, i) => {
  el.addEventListener('click', () => {
    selectedPhoto = i;
    paintSlots();
  });
});

document.getElementById('addPhotos').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 4);
  for (const file of files) {
    const free = photos.findIndex((p) => !p);
    const at = free === -1 ? selectedPhoto : free;
    await putPhoto(at, URL.createObjectURL(file));
  }
  e.target.value = '';
});

document.querySelectorAll('[data-sample]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const free = photos.findIndex((p) => !p);
    const at = free === -1 ? selectedPhoto : free;
    await putPhoto(at, `samples/${btn.dataset.sample}.jpg`);
  });
});

/* ---------- panels: click to place, drag to slide ---------- */

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const ux = (clientX - rect.left) / rect.width;
  const uy = (clientY - rect.top) / rect.height;
  const polys = panelPolygons(state.layout);
  for (let i = polys.length - 1; i >= 0; i--) {
    const poly = polys[i];
    let inside = false;
    for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
      const [ax, ay] = poly[a];
      const [bx, by] = poly[b];
      if (ay > uy !== by > uy && ux < ((bx - ax) * (uy - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}

const zoom = document.getElementById('zoom');
const panelName = document.getElementById('panelName');

function pickPanel(i) {
  selectedPanel = i;
  panelName.textContent = `Panel ${i + 1}`;
  zoom.value = state.panels[i].zoom;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i === -1) return;
  pickPanel(i);
  if (photos[selectedPhoto] && state.panels[i].img !== photos[selectedPhoto]) {
    state.panels[i].img = photos[selectedPhoto];
    say(`Photo ${selectedPhoto + 1} placed in panel ${i + 1}. Drag to slide it, zoom to crop tighter.`);
  }
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[selectedPanel];
  panel.x = Math.max(-1, Math.min(1, panel.x + ((e.clientX - drag.x) / rect.width) * 2.4));
  panel.y = Math.max(-1, Math.min(1, panel.y + ((e.clientY - drag.y) / rect.height) * 2.4));
  drag = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

zoom.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoom.value);
  redraw();
});

/* ---------- layout, grade, size, words ---------- */

function buttonGroup(id, attr, apply) {
  const group = document.getElementById(id);
  group.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
      apply(btn.dataset[attr]);
      redraw();
    });
  });
}

buttonGroup('layoutBtns', 'layout', (v) => { state.layout = v; });
buttonGroup('gradeBtns', 'grade', (v) => { state.grade = v; });

document.getElementById('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});
document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

/* ---------- export ---------- */

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-panels-${w}x${h}.png`;
    a.click();
    say(`Saved vice-panels-${w}x${h}.png — ${LAYOUTS[state.layout].label}, ${GRADES[state.grade].label}.`);
  }, 'image/png');
});

/* ---------- start ---------- */

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    state,
    photos,
    loadImage,
    redraw,
    redrawAt,
    paintSlots,
    async loadSample(name) {
      const img = await loadImage(`samples/${name}.jpg`);
      return img;
    },
  });
} else {
  (async () => {
    const pier = await loadImage('samples/pier.jpg');
    const boulevard = await loadImage('samples/boulevard.jpg');
    photos[0] = pier;
    photos[1] = boulevard;
    state.panels[0].img = pier;
    state.panels[1].img = boulevard;
    state.panels[2].img = pier;
    state.panels[2].x = 0.55;
    state.panels[3].img = boulevard;
    state.panels[3].y = -0.4;
    paintSlots();
    pickPanel(0);
    redraw();
    say('Two sample photos are loaded. Add your own, click panels to place them, then export.');
  })();
}
