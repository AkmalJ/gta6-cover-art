// Fixed scenes for the screenshots, driven by the ?shot= query (see shots.json).
//
// ?shot=cover renders one exported cover full-bleed: layout, grade, caption, subtitle and the
// comma-separated sample photos all come from the query, and each panel gets a preset crop so
// the same sample can appear twice without looking pasted. ?shot=editor shows the editor itself
// with both samples loaded and the panels filled. window.__shotReady is set once painted.

const CROPS = [
  { zoom: 1.12, x: 0, y: 0 },
  { zoom: 1.22, x: -0.3, y: 0.12 },
  { zoom: 1.3, x: 0.55, y: -0.05 },
  { zoom: 1.16, x: 0, y: -0.4 },
];

export async function runShot(shot, query, api) {
  const { state, loadSample, redrawAt, redraw, paintSlots, photos } = api;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.layout = query.get('layout') || 'triptych';
    state.grade = query.get('grade') || 'sunset';
    state.caption = query.get('caption') || '';
    state.subtitle = query.get('subtitle') || '';
    const names = (query.get('photos') || 'pier,boulevard,pier').split(',');
    for (let i = 0; i < state.panels.length; i++) {
      const img = await loadSample(names[i % names.length]);
      state.panels[i].img = img;
      Object.assign(state.panels[i], CROPS[i]);
    }
    redrawAt(window.innerWidth, window.innerHeight);
  } else {
    const pier = await loadSample('pier');
    const boulevard = await loadSample('boulevard');
    photos[0] = pier;
    photos[1] = boulevard;
    state.panels[0].img = pier;
    state.panels[1].img = boulevard;
    state.panels[2].img = pier;
    state.panels[2].x = 0.55;
    state.panels[3].img = boulevard;
    document.getElementById('caption').value = state.caption;
    document.getElementById('subtitle').value = state.subtitle;
    paintSlots();
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
