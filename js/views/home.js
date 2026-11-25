import { CATALOG, catalogStats, resolveSpec } from '../data/catalog.js';
import { garmentSVG } from '../garments/render.js';
import { listProjects, deleteProject } from '../lib/store.js';
import { esc, icon, confirmDialog, toast, rovingGrid, $ } from '../lib/dom.js';
import { toggleTheme } from '../main.js';

export function appBar(extra = '') {
  return `<header class="appbar">
    <a href="#/" class="brand" aria-label="Atelier home">${brandMark()}<span>Atelier</span></a>
    <div class="appbar-actions">${extra}
      <button type="button" class="icon-btn" data-theme-toggle aria-label="Toggle dark mode">${icon('moon')}</button>
    </div>
  </header>`;
}
export function brandMark() {
  return `<svg width="26" height="26" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="currentColor"/><path d="M190 120l-86 50 34 86 46-18v160h144V238l46 18 34-86-86-50c-14 30-40 48-66 48s-52-18-66-48z" fill="var(--bg)"/><path d="M206 300h100" stroke="var(--accent)" stroke-width="14" stroke-dasharray="16 12" stroke-linecap="round"/></svg>`;
}
export function wireAppBar(root) {
  root.querySelector('[data-theme-toggle]')?.addEventListener('click', () => toggleTheme());
}

export async function mount(root) {
  const stats = catalogStats();
  root.innerHTML = `${appBar()}
  <main id="main" class="page home">
    <section class="hero">
      <h1>Design clothing, stitch by stitch.</h1>
      <p class="lede">Pick a garment from ${stats.types} styles and ${stats.combos.toLocaleString()} cut &amp; material combinations, then add artwork as embroidery, prints or patches.</p>
      <a class="btn btn-primary btn-lg" href="#/new">${icon('plus')} Start a new design</a>
    </section>

    <section aria-labelledby="cat-h" class="section">
      <div class="section-head"><h2 id="cat-h">Start from a category</h2></div>
      <ul class="cat-grid" role="list">
        ${CATALOG.map((c) => {
          const g = c.genres[0], t = g.types[0];
          const spec = resolveSpec({ category: c.id, genre: g.id, type: t.id, cut: null, material: null });
          const p = { ...spec.params, ...c.preview.p, artKey: null };
          return `<li><a class="cat-card" href="#/new/${c.id}">
            <span class="cat-art">${garmentSVG({ tpl: c.preview.tpl, params: p, color: c.id === 'shoes' ? '#2f3135' : '#d9d4c7', accent: c.id === 'shoes' ? '#f2f0eb' : '#c0392b', materialId: c.id === 'tops' ? 'cottonJersey' : c.id === 'bottoms' ? 'denim' : c.id === 'hats' ? 'cottonTwill' : 'leather' })}</span>
            <span class="cat-label">${esc(c.label)}</span>
            <span class="cat-desc">${esc(c.d)}</span>
          </a></li>`;
        }).join('')}
      </ul>
    </section>

    <section aria-labelledby="recent-h" class="section" id="recent">
      <div class="section-head"><h2 id="recent-h">Your designs</h2></div>
      <div class="recent-body"><p class="muted">Loading…</p></div>
    </section>
  </main>`;
  wireAppBar(root);
  rovingGrid($('.cat-grid', root), '.cat-card');
  await renderRecent(root);
}

async function renderRecent(root) {
  const body = $('.recent-body', root);
  const list = await listProjects();
  if (!list.length) {
    body.innerHTML = `<div class="empty"><p>No designs yet. Your work is saved automatically on this device.</p></div>`;
    return;
  }
  body.innerHTML = `<ul class="proj-grid" role="list">${list.map((p) => {
    let art = '';
    if (p.thumb) art = `<img src="${p.thumb}" alt="" loading="lazy">`;
    else {
      const s = resolveSpec(p.sel);
      if (s) art = garmentSVG({ tpl: s.tpl, params: s.params, color: p.color, accent: p.accent, materialId: p.sel.material });
    }
    return `<li class="proj-card">
      <a href="#/design/${esc(p.id)}" class="proj-link">
        <span class="proj-art">${art}</span>
        <span class="proj-name">${esc(p.name)}</span>
        <span class="proj-date">Edited ${esc(timeAgo(p.updated))}</span>
      </a>
      <button type="button" class="icon-btn proj-del" data-del="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">${icon('trash', 18)}</button>
    </li>`;
  }).join('')}</ul>`;
  body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    const name = b.closest('.proj-card').querySelector('.proj-name').textContent;
    if (await confirmDialog(`Delete “${name}”? This can't be undone.`, { okLabel: 'Delete', danger: true, title: 'Delete design' })) {
      await deleteProject(b.dataset.del);
      toast('Design deleted');
      renderRecent(root);
    }
  }));
}

export function timeAgo(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}
