import { CATALOG, STEPS, getCategory, getGenre, getType, getCuts, getMaterials, resolveSpec, productName } from '../data/catalog.js';
import { garmentSVG } from '../garments/render.js';
import { esc, icon, rovingGrid, $, $$, announce } from '../lib/dom.js';
import { saveProject } from '../lib/store.js';
import { newProject } from '../project.js';
import { appBar, wireAppBar } from './home.js';

const NEUTRAL = '#d3cec4';
const STEP_LABELS = { category: 'Category', genre: 'Genre', type: 'Type', cut: 'Cut', material: 'Material' };
const STEP_TITLES = {
  category: 'What are you designing?',
  genre: 'Choose a genre',
  type: 'Choose a type',
  cut: 'Choose a cut',
  material: 'Choose a material',
};

export function mount(root, [rest]) {
  const segs = (rest || '').split('/').filter(Boolean);
  const sel = {};
  // validate path progressively
  const keys = STEPS.slice(0, 4);
  for (let i = 0; i < segs.length && i < keys.length; i++) sel[keys[i]] = decodeURIComponent(segs[i]);
  if (sel.category && !getCategory(sel.category)) return redirect('#/new');
  if (sel.genre && !getGenre(sel.category, sel.genre)) return redirect(`#/new/${sel.category}`);
  if (sel.type && !getType(sel.category, sel.genre, sel.type)) return redirect(`#/new/${sel.category}/${sel.genre}`);
  const stepIdx = Math.min(segs.length, 4);
  const step = STEPS[stepIdx];
  const options = optionsFor(step, sel);
  const pathTo = (i) => '#/new' + (i ? '/' + keys.slice(0, i).map((k) => sel[k]).join('/') : '');
  const nameSoFar = sel.type ? productName({ ...sel }) : '';

  root.innerHTML = `${appBar()}
  <main id="main" class="page wizard">
    <nav class="stepper" aria-label="Design steps">
      <ol>
        ${STEPS.map((s, i) => {
          const val = valueLabel(s, sel);
          const state = i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo';
          const inner = `<span class="step-num" aria-hidden="true">${i < stepIdx ? icon('check', 14) : i + 1}</span><span class="step-text"><span class="step-name">${STEP_LABELS[s]}</span>${val ? `<span class="step-val">${esc(val)}</span>` : ''}</span>`;
          return `<li class="step ${state}">${i < stepIdx ? `<a href="${pathTo(i)}" aria-label="${STEP_LABELS[s]}: ${esc(val)}. Change">${inner}</a>` : `<span ${state === 'current' ? 'aria-current="step"' : ''}>${inner}</span>`}</li>`;
        }).join('')}
      </ol>
    </nav>
    <div class="wiz-layout">
      <section class="wiz-main" aria-labelledby="wiz-h">
        <div class="wiz-head">
          ${stepIdx > 0 ? `<a class="btn btn-ghost btn-sm back-link" href="${pathTo(stepIdx - 1)}">${icon('back', 16)} Back</a>` : ''}
          <h1 id="wiz-h">${STEP_TITLES[step]}</h1>
          <p class="muted">${hint(step, sel, options.length)}</p>
        </div>
        ${options.length > 8 ? `<div class="filter-row"><label class="search-field">${icon('search', 18)}<span class="sr-only">Filter options</span><input type="search" placeholder="Filter ${options.length} options…" data-filter autocomplete="off"></label></div>` : ''}
        <ul class="opt-grid ${step === 'category' ? 'opt-grid-lg' : ''}" role="list" aria-label="${STEP_LABELS[step]} options">
          ${options.map((o) => `<li data-search="${esc((o.label + ' ' + (o.d || '')).toLowerCase())}">
            <button type="button" class="opt" data-id="${esc(o.id)}" aria-describedby="d-${esc(o.id)}">
              <span class="opt-art">${o.art}</span>
              <span class="opt-label">${esc(o.label)}</span>
              <span class="opt-desc" id="d-${esc(o.id)}">${esc(o.d || '')}${o.meta ? ` <span class="opt-meta">· ${esc(o.meta)}</span>` : ''}</span>
            </button></li>`).join('')}
        </ul>
        <p class="no-results muted" hidden>No options match your filter.</p>
      </section>
      <aside class="wiz-summary" aria-label="Your selection">
        <div class="summary-card">
          <div class="summary-art" aria-hidden="true">${summaryArt(sel, null, step)}</div>
          <p class="summary-kicker">${sel.category ? 'Your garment' : 'Start by choosing a category'}</p>
          <p class="summary-name" data-summary-name>${esc(nameSoFar || (sel.genre ? getGenre(sel.category, sel.genre).label : sel.category ? getCategory(sel.category).label : ''))}</p>
          <dl class="summary-list">
            ${STEPS.map((s) => `<div><dt>${STEP_LABELS[s]}</dt><dd>${esc(valueLabel(s, sel) || '—')}</dd></div>`).join('')}
          </dl>
        </div>
      </aside>
    </div>
  </main>`;
  wireAppBar(root);

  const grid = $('.opt-grid', root);
  rovingGrid(grid, '.opt');
  const artEl = $('.summary-art', root);
  const nameEl = $('[data-summary-name]', root);
  let hoverT;
  const preview = (id) => {
    clearTimeout(hoverT);
    hoverT = setTimeout(() => {
      artEl.innerHTML = summaryArt(sel, id, step);
      if (step === 'cut' || step === 'material' || step === 'type') {
        const s2 = { ...sel, [step]: id };
        nameEl.textContent = productName(s2);
      }
    }, 40);
  };
  grid.addEventListener('pointerover', (e) => { const b = e.target.closest('.opt'); if (b) preview(b.dataset.id); });
  grid.addEventListener('focusin', (e) => { const b = e.target.closest('.opt'); if (b) preview(b.dataset.id); });
  grid.addEventListener('click', async (e) => {
    const b = e.target.closest('.opt');
    if (!b) return;
    const id = b.dataset.id;
    if (step === 'material') {
      b.setAttribute('aria-busy', 'true');
      const proj = newProject({ ...sel, material: id });
      await saveProject(proj);
      announce(`${proj.name} created. Opening designer.`);
      location.hash = `#/design/${proj.id}`;
    } else {
      location.hash = pathTo(stepIdx) + (stepIdx ? '/' : '/') + encodeURIComponent(id);
    }
  });
  const filter = $('[data-filter]', root);
  if (filter) {
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      let shown = 0;
      $$('li[data-search]', grid).forEach((li) => { const ok = !q || li.dataset.search.includes(q); li.hidden = !ok; if (ok) shown++; });
      $('.no-results', root).hidden = shown > 0;
      announce(`${shown} option${shown === 1 ? '' : 's'}`);
    });
  }
}

function redirect(h) { location.replace(h); return null; }

function valueLabel(step, sel) {
  const s = resolveSpec({ ...sel, cut: sel.cut, material: sel.material }) || {};
  if (step === 'category') return sel.category ? getCategory(sel.category)?.label : '';
  if (step === 'genre') return sel.genre ? getGenre(sel.category, sel.genre)?.label : '';
  if (step === 'type') return s.type?.label || '';
  if (step === 'cut') return s.cut?.label || '';
  if (step === 'material') return s.material?.label || '';
  return '';
}

function hint(step, sel, n) {
  switch (step) {
    case 'category': return 'Pick the kind of garment to start from.';
    case 'genre': return `${n} genres of ${getCategory(sel.category).label.toLowerCase()}.`;
    case 'type': return `${n} types of ${getGenre(sel.category, sel.genre).label.toLowerCase()}.`;
    case 'cut': return `How should your ${getType(sel.category, sel.genre, sel.type).label.toLowerCase()} fit? ${n} cuts available.`;
    case 'material': return `${n} materials. You can change the colour in the designer.`;
  }
  return '';
}

function art(tpl, params, materialId, color, accent) {
  return garmentSVG({ tpl, params, color: color || NEUTRAL, accent: accent || (tpl === 'shoe' ? '#f2f0eb' : '#b5483a'), materialId: materialId || 'cottonJersey' });
}

function optionsFor(step, sel) {
  if (step === 'category') {
    return CATALOG.map((c) => {
      const g = c.genres[0], t = g.types[0];
      const s = resolveSpec({ category: c.id, genre: g.id, type: t.id });
      const n = c.genres.reduce((a, gg) => a + gg.types.length, 0);
      return { id: c.id, label: c.label, d: c.d, meta: `${n} types`, art: art(c.preview.tpl, { ...s.params, ...c.preview.p }, c.id === 'shoes' ? 'leather' : 'cottonJersey') };
    });
  }
  if (step === 'genre') {
    return getCategory(sel.category).genres.map((g) => {
      const t = g.types[0];
      const s = resolveSpec({ category: sel.category, genre: g.id, type: t.id });
      return { id: g.id, label: g.label, d: g.d, meta: `${g.types.length} types`, art: art(s.tpl, s.params) };
    });
  }
  if (step === 'type') {
    return getGenre(sel.category, sel.genre).types.map((t) => {
      const s = resolveSpec({ category: sel.category, genre: sel.genre, type: t.id });
      return { id: t.id, label: t.label, d: t.d, meta: `${getCuts(t).length} cuts`, art: art(s.tpl, s.params) };
    });
  }
  if (step === 'cut') {
    const t = getType(sel.category, sel.genre, sel.type);
    return getCuts(t).map((c) => {
      const s = resolveSpec({ ...sel, cut: c.id });
      return { id: c.id, label: c.label, d: c.d, art: art(s.tpl, s.params) };
    });
  }
  if (step === 'material') {
    const t = getType(sel.category, sel.genre, sel.type);
    return getMaterials(t).map((m) => {
      const s = resolveSpec({ ...sel, material: m.id });
      return { id: m.id, label: m.label, d: m.desc, art: art(s.tpl, s.params, m.id, m.color) };
    });
  }
  return [];
}

function summaryArt(sel, hoverId, step) {
  if (!sel.category && !hoverId) return `<div class="summary-empty">${icon('shirt', 48)}</div>`;
  const s2 = { ...sel };
  if (hoverId) s2[step] = hoverId;
  if (!s2.genre) {
    const c = getCategory(s2.category); if (!c) return '';
    s2.genre = c.genres[0].id;
  }
  if (!s2.type) s2.type = getGenre(s2.category, s2.genre)?.types[0].id;
  const s = resolveSpec(s2);
  if (!s) return '';
  return art(s.tpl, s.params, s2.material, s.material?.color);
}
