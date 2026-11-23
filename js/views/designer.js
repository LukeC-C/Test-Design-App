import { resolveSpec, productName, getCuts, getMaterials, getType } from '../data/catalog.js';
import { MATERIALS } from '../data/materials.js';
import { garmentLayers, viewsFor } from '../garments/render.js';
import { METHODS, methodById, methodIcon, methodFilterDefs, renderMethod, PATCH_SHAPES } from '../components/methods.js';
import { getProject, saveProject } from '../lib/store.js';
import { esc, icon, $, $$, h, uid, clamp, debounce, announce, toast, openDialog, confirmDialog } from '../lib/dom.js';
import { SWATCHES, isDark } from '../lib/color.js';
import { loadImage, downloadBlob, makeCanvas } from '../lib/image.js';
import { defaultAccent } from '../project.js';

export async function mount(root, [id]) {
  const project = await getProject(id);
  if (!project) {
    root.innerHTML = `<main id="main" class="page"><h1>Design not found</h1><p class="muted" style="margin:12px 0 20px">It may have been deleted, or it was created on another device.</p><a class="btn btn-primary" href="#/">Go home</a></main>`;
    return;
  }
  const d = new Designer(root, project);
  return () => d.destroy();
}

const ACCENT_LABEL = { top: 'Contrast trim', bottom: 'Contrast trim', hat: 'Band & trim', shoe: 'Sole colour' };
const MAX_HISTORY = 80;

class Designer {
  constructor(root, project) {
    this.root = root;
    this.p = project;
    this.p.views ||= { front: [], back: [] };
    this.view = 'front';
    this.selId = null;
    this.fx = new Map();      // effect cache key -> url
    this.fxPending = new Set();
    this.hist = [];
    this.hIdx = -1;
    this.pointers = new Map();
    this.uid = uid().slice(0, 6);
    this.save = debounce(() => this.persist(), 500);
    this.thumb = debounce(() => this.makeThumb(), 2200);
    this.mtab = 'canvas';
    this.render();
    this.snapshot();
    this.onKey = (e) => this.handleKey(e);
    window.addEventListener('keydown', this.onKey);
    this.ro = new ResizeObserver(() => this.drawOverlay());
    this.ro.observe(this.stage);
  }
  destroy() {
    window.removeEventListener('keydown', this.onKey);
    this.ro?.disconnect();
    this.save.flush();
  }

  get spec() { return resolveSpec(this.p.sel); }
  get els() { return this.p.views[this.view]; }
  get sel() { return this.els.find((e) => e.id === this.selId) || null; }

  // ───────────────────────── Layout ─────────────────────────
  render() {
    const s = this.spec;
    const views = viewsFor(s.tpl);
    this.root.innerHTML = `
    <div class="dz" data-mtab="${this.mtab}">
      <header class="dz-top">
        <a class="icon-btn" href="#/" aria-label="Back to home">${icon('back')}</a>
        <div class="dz-title">
          <label for="dz-name" class="sr-only">Design name</label>
          <input id="dz-name" class="title-input" value="${esc(this.p.name)}" maxlength="80" autocomplete="off" spellcheck="false">
          <span class="dz-sub" data-sub>${esc(this.subtitle())}</span>
        </div>
        <div class="seg dz-views" role="group" aria-label="Garment side">
          ${views.map((v) => `<button type="button" data-view="${v.id}" aria-pressed="${v.id === this.view}">${v.label}</button>`).join('')}
        </div>
        <div class="dz-actions">
          <button type="button" class="icon-btn" data-undo aria-label="Undo" title="Undo (Ctrl+Z)">${icon('undo')}</button>
          <button type="button" class="icon-btn" data-redo aria-label="Redo" title="Redo (Ctrl+Shift+Z)">${icon('redo')}</button>
          <span class="save-state" data-save aria-live="polite">Saved</span>
          <button type="button" class="btn btn-sm btn-primary" data-export>${icon('download', 18)}<span class="hide-sm">Export</span></button>
        </div>
      </header>
      <div class="dz-body">
        <aside class="dz-left panel" aria-labelledby="layers-h" data-pane="layers">
          <div class="panel-head"><h2 id="layers-h">Layers</h2><span class="muted" data-count></span></div>
          <button type="button" class="btn btn-accent add-btn" data-add>${icon('plus', 18)} Add artwork</button>
          <ul class="layers" data-layers aria-label="Artwork layers, top first"></ul>
          <p class="layers-hint muted">Tip: drag on the canvas to move. Use the corner handles to resize and the top handle to rotate.</p>
        </aside>
        <main id="main" class="dz-stage-wrap" data-pane="canvas">
          <h1 class="sr-only">Designer — ${esc(this.p.name)}</h1>
          <div class="stage" tabindex="0" role="application" aria-roledescription="design canvas" aria-label="Design canvas" aria-describedby="stage-help">
            <svg class="stage-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg>
          </div>
          <p id="stage-help" class="sr-only">Select artwork from the layers list. Arrow keys move it, Shift plus arrows moves faster. Delete removes it, E opens the image editor. Plus and minus zoom the canvas.</p>
          <div class="stage-ctrls" role="toolbar" aria-label="Zoom">
            <button type="button" class="icon-btn sm" data-zoom="out" aria-label="Zoom out">${icon('zoomOut', 18)}</button>
            <button type="button" class="zoom-pct" data-zoom="fit" aria-label="Fit to screen" title="Fit">100%</button>
            <button type="button" class="icon-btn sm" data-zoom="in" aria-label="Zoom in">${icon('zoomIn', 18)}</button>
          </div>
          <button type="button" class="fab btn btn-accent" data-add aria-label="Add artwork">${icon('plus', 22)}<span>Add</span></button>
        </main>
        <aside class="dz-right panel" aria-label="Properties">
          <div class="tabs" role="tablist" aria-label="Properties">
            <button type="button" role="tab" id="tab-art" aria-controls="tp-art" data-tab="artwork">Artwork</button>
            <button type="button" role="tab" id="tab-gar" aria-controls="tp-gar" data-tab="garment">Garment</button>
          </div>
          <div class="tabpanel" role="tabpanel" id="tp-art" aria-labelledby="tab-art" data-pane="artwork"></div>
          <div class="tabpanel" role="tabpanel" id="tp-gar" aria-labelledby="tab-gar" data-pane="garment"></div>
        </aside>
      </div>
      <nav class="dz-mtabs" role="tablist" aria-label="Panels">
        ${[['canvas', 'shirt', 'Canvas'], ['layers', 'layers', 'Layers'], ['artwork', 'sliders', 'Artwork'], ['garment', 'palette', 'Garment']].map(([id, ic, lb]) => `<button type="button" role="tab" data-mtab="${id}" aria-selected="${this.mtab === id}">${icon(ic, 20)}<span>${lb}</span></button>`).join('')}
      </nav>
    </div>`;
    this.stage = $('.stage', this.root);
    this.svg = $('.stage-svg', this.root);
    this.wireChrome();
    this.buildStage();
    this.renderLayers();
    this.setTab(this.selId ? 'artwork' : 'garment');
    this.renderGarmentPanel();
  }

  subtitle() {
    const s = this.spec;
    return [s.material?.label, s.cut?.label, s.type.label].filter(Boolean).join(' · ');
  }

  wireChrome() {
    const r = this.root;
    $('#dz-name', r).addEventListener('input', (e) => { this.p.name = e.target.value || 'Untitled design'; this.p.customName = true; this.save(); });
    $('#dz-name', r).addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
    $$('[data-view]', r).forEach((b) => b.addEventListener('click', () => this.setView(b.dataset.view)));
    $('[data-undo]', r).addEventListener('click', () => this.undo());
    $('[data-redo]', r).addEventListener('click', () => this.redo());
    $('[data-export]', r).addEventListener('click', () => this.openExport());
    $$('[data-add]', r).forEach((b) => b.addEventListener('click', () => this.addArtwork()));
    $$('[data-zoom]', r).forEach((b) => b.addEventListener('click', () => {
      const z = b.dataset.zoom;
      if (z === 'fit') this.fit(); else this.zoomBy(z === 'in' ? 1.25 : 0.8);
    }));
    $$('.tabs [data-tab]', r).forEach((b) => b.addEventListener('click', () => this.setTab(b.dataset.tab)));
    $('.tabs', r).addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = $$('.tabs [data-tab]', r); const i = tabs.indexOf(document.activeElement);
      const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[j].focus(); this.setTab(tabs[j].dataset.tab);
    });
    $$('.dz-mtabs [data-mtab]', r).forEach((b) => b.addEventListener('click', () => this.setMTab(b.dataset.mtab)));
    this.updateHistoryButtons();
  }

  setTab(tab) {
    this.tab = tab;
    $$('.tabs [data-tab]', this.root).forEach((b) => {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
    });
    $('#tp-art', this.root).hidden = tab !== 'artwork';
    $('#tp-gar', this.root).hidden = tab !== 'garment';
    if (tab === 'artwork') this.renderProps();
  }
  setMTab(t) {
    this.mtab = t;
    $('.dz', this.root).dataset.mtab = t;
    $$('.dz-mtabs [data-mtab]', this.root).forEach((b) => b.setAttribute('aria-selected', b.dataset.mtab === t));
    if (t === 'artwork' || t === 'garment') this.setTab(t);
    if (t === 'canvas') requestAnimationFrame(() => this.drawOverlay());
  }

  setView(v) {
    if (v === this.view) return;
    this.view = v;
    this.selId = null;
    $$('[data-view]', this.root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === v));
    this.buildStage();
    this.renderLayers();
    this.renderProps();
    announce(`Showing ${viewsFor(this.spec.tpl).find((x) => x.id === v).label.toLowerCase()} view`);
  }

  // ───────────────────────── Stage ─────────────────────────
  buildStage() {
    const s = this.spec;
    const L = garmentLayers({ tpl: s.tpl, params: s.params, view: this.view, color: this.p.color, accent: this.p.accent, materialId: this.p.sel.material });
    this.L = L;
    if (!this.vb || this.vbKey !== L.viewBox) { this.vb = { ...L.box }; this.vbKey = L.viewBox; }
    this.svg.innerHTML = `<defs>${L.defs}${methodFilterDefs(this.uid)}</defs>${L.under}<g class="els" clip-path="url(#${L.clipId})"></g>${L.over}<g class="overlay"></g>`;
    this.elsG = $('.els', this.svg);
    this.overlay = $('.overlay', this.svg);
    this.applyVB();
    this.renderElements();
    if (!this.stageWired) { this.wireStage(); this.stageWired = true; }
    this.stage.setAttribute('aria-label', `Design canvas, ${viewsFor(s.tpl).find((x) => x.id === this.view).label} view of ${this.p.name}. ${this.els.length} artwork layer${this.els.length === 1 ? '' : 's'}.`);
  }

  applyVB() {
    const v = this.vb;
    this.svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
    const z = Math.round((this.L.box.w / v.w) * 100);
    const pct = $('.zoom-pct', this.root); if (pct) pct.textContent = z + '%';
    this.drawOverlay();
  }
  fit() { this.vb = { ...this.L.box }; this.applyVB(); }
  zoomBy(f, cx, cy) {
    const v = this.vb, box = this.L.box;
    const nz = clamp((box.w / v.w) * f, 0.4, 10);
    const nw = box.w / nz, nh = box.h / nz;
    const px = cx ?? v.x + v.w / 2, py = cy ?? v.y + v.h / 2;
    this.vb = { x: px - (px - v.x) * (nw / v.w), y: py - (py - v.y) * (nh / v.h), w: nw, h: nh };
    this.applyVB();
  }
  toSVG(clientX, clientY) {
    const m = this.svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const pt = this.svg.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  }
  unitsPerPx() {
    const m = this.svg.getScreenCTM();
    return m ? 1 / m.a : 1;
  }

  // ───────────────────────── Elements ─────────────────────────
  fxKey(el) {
    const b = Math.round(Math.log(Math.max(4, el.w)) / Math.log(1.12));
    return [el.id, el.rev || 0, el.method, b, el.shape, el.patchBg, el.border, el.colors].join('|');
  }
  effectURL(el) {
    const key = this.fxKey(el);
    if (this.fx.has(key)) return this.fx.get(key);
    if (!this.fxPending.has(key)) {
      this.fxPending.add(key);
      const b = Math.round(Math.log(Math.max(4, el.w)) / Math.log(1.12));
      const wq = Math.pow(1.12, b);
      renderMethod(el.img, el.method, { w: wq, h: wq * (el.h / el.w), shape: el.shape, patchBg: el.patchBg, border: el.border, colors: el.colors })
        .then((url) => {
          this.fx.set(key, url);
          this.fxPending.delete(key);
          const img = this.elsG?.querySelector(`[data-id="${el.id}"] image`);
          if (img && this.fxKey(el) === key) { img.setAttribute('href', url); img.removeAttribute('data-pending'); }
          this.thumb();
        })
        .catch((e) => { console.error(e); this.fxPending.delete(key); });
    }
    return null;
  }
  async effectURLAsync(el) {
    const key = this.fxKey(el);
    if (this.fx.has(key)) return this.fx.get(key);
    const b = Math.round(Math.log(Math.max(4, el.w)) / Math.log(1.12));
    const wq = Math.pow(1.12, b);
    const url = await renderMethod(el.img, el.method, { w: wq, h: wq * (el.h / el.w), shape: el.shape, patchBg: el.patchBg, border: el.border, colors: el.colors });
    this.fx.set(key, url);
    return url;
  }

  elMarkup(el, url, uidForFilters = this.uid) {
    const pending = !url;
    const href = url || el.img;
    const flip = el.flip ? ' transform="scale(-1 1)"' : '';
    return `<g class="el${el.locked ? ' locked' : ''}" data-id="${el.id}" transform="translate(${r2(el.x)} ${r2(el.y)}) rotate(${r2(el.rot || 0)})" opacity="${el.opacity ?? 1}"${el.hidden ? ' visibility="hidden"' : ''}>
      <g${flip}><image href="${href}" x="${r2(-el.w / 2)}" y="${r2(-el.h / 2)}" width="${r2(el.w)}" height="${r2(el.h)}" preserveAspectRatio="none" filter="url(#f-${el.method}-${uidForFilters})"${pending ? ' data-pending="1"' : ''}/></g>
      <rect class="hit" x="${r2(-el.w / 2)}" y="${r2(-el.h / 2)}" width="${r2(el.w)}" height="${r2(el.h)}" fill="transparent"/>
    </g>`;
  }
  renderElements() {
    this.elsG.innerHTML = this.els.map((el) => this.elMarkup(el, this.effectURL(el))).join('');
    this.drawOverlay();
  }
  updateElTransform(el) {
    const g = this.elsG.querySelector(`[data-id="${el.id}"]`);
    if (!g) return;
    g.setAttribute('transform', `translate(${r2(el.x)} ${r2(el.y)}) rotate(${r2(el.rot || 0)})`);
    g.setAttribute('opacity', el.opacity ?? 1);
    const im = g.querySelector('image'), hit = g.querySelector('.hit');
    for (const n of [im, hit]) { n.setAttribute('x', r2(-el.w / 2)); n.setAttribute('y', r2(-el.h / 2)); n.setAttribute('width', r2(el.w)); n.setAttribute('height', r2(el.h)); }
    g.firstElementChild.setAttribute('transform', el.flip ? 'scale(-1 1)' : '');
  }

  drawOverlay() {
    if (!this.overlay) return;
    const el = this.sel;
    if (!el || el.hidden) { this.overlay.innerHTML = ''; return; }
    const u = this.unitsPerPx();
    const hs = 11 * u, rr = 26 * u;
    const w = el.w / 2, hh = el.h / 2;
    const corners = [['nw', -w, -hh], ['ne', w, -hh], ['se', w, hh], ['sw', -w, hh]];
    this.overlay.innerHTML = `<g transform="translate(${r2(el.x)} ${r2(el.y)}) rotate(${r2(el.rot || 0)})">
      <rect x="${-w}" y="${-hh}" width="${el.w}" height="${el.h}" fill="none" stroke="var(--focus)" stroke-width="${1.5 * u}" vector-effect="non-scaling-stroke" stroke-dasharray="${el.locked ? '4 3' : 'none'}"/>
      ${el.locked ? '' : `<line x1="0" y1="${-hh}" x2="0" y2="${-hh - rr}" stroke="var(--focus)" stroke-width="${1.5 * u}"/>
      <circle class="handle" data-handle="rot" cx="0" cy="${-hh - rr}" r="${hs * 0.75}" fill="#fff" stroke="var(--focus)" stroke-width="${1.5 * u}"/>
      ${corners.map(([k, x, y]) => `<rect class="handle h-${k}" data-handle="${k}" x="${x - hs / 2}" y="${y - hs / 2}" width="${hs}" height="${hs}" rx="${2 * u}" fill="#fff" stroke="var(--focus)" stroke-width="${1.5 * u}"/>`).join('')}`}
    </g>`;
  }

  // ───────────────────────── Pointer interaction ─────────────────────────
  wireStage() {
    const svg = this.svg;
    svg.addEventListener('pointerdown', (e) => this.onDown(e));
    svg.addEventListener('pointermove', (e) => this.onMove(e));
    svg.addEventListener('pointerup', (e) => this.onUp(e));
    svg.addEventListener('pointercancel', (e) => this.onUp(e));
    svg.addEventListener('dblclick', (e) => { const g = e.target.closest('.el'); if (g) { this.select(g.dataset.id); this.editImage(); } });
    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const p = this.toSVG(e.clientX, e.clientY);
        this.zoomBy(Math.exp(-e.deltaY * 0.01), p.x, p.y);
      } else {
        const u = this.unitsPerPx();
        this.vb.x += e.deltaX * u; this.vb.y += e.deltaY * u; this.applyVB();
      }
    }, { passive: false });
    svg.addEventListener('contextmenu', (e) => { if (e.target.closest('.el')) e.preventDefault(); });
  }
  onDown(e) {
    this.svg.setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      // pinch-zoom the canvas
      const [a, b] = [...this.pointers.values()];
      this.gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), vb0: { ...this.vb }, mid0: this.toSVG((a.x + b.x) / 2, (a.y + b.y) / 2), midC: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      return;
    }
    const p = this.toSVG(e.clientX, e.clientY);
    const handle = e.target.closest('[data-handle]');
    const gEl = e.target.closest('.el');
    if (handle && this.sel) {
      const el = this.sel;
      this.gesture = { type: handle.dataset.handle === 'rot' ? 'rotate' : 'scale', el, p0: p, start: { ...el }, d0: Math.hypot(p.x - el.x, p.y - el.y) };
    } else if (gEl) {
      this.select(gEl.dataset.id, { focusLayer: false });
      const el = this.sel;
      this.gesture = el.locked ? { type: 'none' } : { type: 'move', el, p0: p, start: { ...el } };
    } else {
      this.gesture = { type: 'pan', c0: { x: e.clientX, y: e.clientY }, vb0: { ...this.vb }, moved: false };
      this.stage.classList.add('panning');
    }
    this.gesture.moved = false;
  }
  onMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = this.gesture;
    if (!g) return;
    if (g.type === 'pinch' && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const f = d / (g.d0 || 1);
      const box = this.L.box;
      const nz = clamp((box.w / g.vb0.w) * f, 0.4, 10);
      const nw = box.w / nz, nh = box.h / nz;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const u = nw / this.svg.clientWidth * Math.max(1, (this.svg.clientWidth / this.svg.clientHeight) / (box.w / box.h));
      this.vb = { x: g.mid0.x - (g.mid0.x - g.vb0.x) * (nw / g.vb0.w) - (mid.x - g.midC.x) * u, y: g.mid0.y - (g.mid0.y - g.vb0.y) * (nh / g.vb0.h) - (mid.y - g.midC.y) * u, w: nw, h: nh };
      this.applyVB();
      return;
    }
    const p = this.toSVG(e.clientX, e.clientY);
    if (g.type === 'move') {
      const dx = p.x - g.p0.x, dy = p.y - g.p0.y;
      if (!g.moved && Math.hypot(dx, dy) < 1.5 * this.unitsPerPx()) return;
      g.moved = true;
      let nx = g.start.x + dx, ny = g.start.y + dy;
      // snap to vertical centre line of the garment
      const cxLine = this.L.box.x + this.L.box.w / 2;
      if (!e.altKey && Math.abs(nx - cxLine) < 6 * this.unitsPerPx()) { nx = cxLine; this.showGuide(true); } else this.showGuide(false);
      g.el.x = nx; g.el.y = ny;
      this.updateElTransform(g.el); this.drawOverlay();
    } else if (g.type === 'scale') {
      const d = Math.hypot(p.x - g.start.x, p.y - g.start.y);
      const f = Math.max(0.05, d / (g.d0 || 1));
      g.el.w = Math.max(4, g.start.w * f); g.el.h = Math.max(4, g.start.h * f);
      g.moved = true;
      this.updateElTransform(g.el); this.drawOverlay();
    } else if (g.type === 'rotate') {
      let a = (Math.atan2(p.y - g.start.y, p.x - g.start.x) * 180) / Math.PI + 90;
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      else if (Math.abs(((a % 90) + 90) % 90) < 3 || Math.abs(((a % 90) + 90) % 90) > 87) a = Math.round(a / 90) * 90;
      g.el.rot = normAngle(a);
      g.moved = true;
      this.updateElTransform(g.el); this.drawOverlay();
    } else if (g.type === 'pan') {
      const u = this.unitsPerPx();
      const dx = e.clientX - g.c0.x, dy = e.clientY - g.c0.y;
      if (Math.hypot(dx, dy) > 3) g.moved = true;
      this.vb = { ...this.vb, x: g.vb0.x - dx * u, y: g.vb0.y - dy * u };
      this.applyVB();
    }
  }
  onUp(e) {
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    this.stage.classList.remove('panning');
    this.showGuide(false);
    if (!g) return;
    if (g.type === 'pinch') { if (this.pointers.size < 2) this.gesture = null; return; }
    if (g.type === 'pan' && !g.moved) this.select(null);
    if ((g.type === 'move' || g.type === 'scale' || g.type === 'rotate') && g.moved) {
      if (g.type === 'scale') this.refreshEffect(g.el);
      this.commit(g.type === 'move' ? 'Moved artwork' : g.type === 'scale' ? 'Resized artwork' : 'Rotated artwork');
      this.renderProps();
    }
    this.gesture = null;
  }
  showGuide(on) {
    let gl = this.svg.querySelector('.guide');
    if (on && !gl) {
      const b = this.L.box, cx = b.x + b.w / 2;
      gl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gl.setAttribute('class', 'guide');
      gl.setAttribute('x1', cx); gl.setAttribute('x2', cx); gl.setAttribute('y1', b.y); gl.setAttribute('y2', b.y + b.h);
      gl.setAttribute('stroke', 'var(--accent)'); gl.setAttribute('stroke-width', 1); gl.setAttribute('vector-effect', 'non-scaling-stroke'); gl.setAttribute('stroke-dasharray', '4 4');
      this.svg.appendChild(gl);
    } else if (!on && gl) gl.remove();
  }
  refreshEffect(el) {
    const url = this.effectURL(el);
    const img = this.elsG.querySelector(`[data-id="${el.id}"] image`);
    if (img && url) img.setAttribute('href', url);
  }

  // ───────────────────────── Selection & layers ─────────────────────────
  select(id, { focusLayer = false } = {}) {
    if (id === this.selId) { this.drawOverlay(); return; }
    this.selId = id;
    this.drawOverlay();
    this.renderLayers(focusLayer);
    if (id && this.tab !== 'artwork' && this.mtab !== 'layers') this.setTab('artwork'); else this.renderProps();
    if (id) announce(`${this.sel.name} selected`);
  }

  renderLayers(focus = false) {
    const ul = $('[data-layers]', this.root);
    const count = $('[data-count]', this.root);
    count.textContent = this.els.length ? `${this.els.length}` : '';
    if (!this.els.length) {
      ul.innerHTML = `<li class="layers-empty">No artwork on this side yet.</li>`;
      return;
    }
    ul.innerHTML = [...this.els].reverse().map((el) => `
      <li class="layer ${el.id === this.selId ? 'selected' : ''}" data-id="${el.id}">
        <button type="button" class="layer-main" aria-pressed="${el.id === this.selId}" aria-label="${esc(el.name)}, ${esc(methodById(el.method).label)}${el.hidden ? ', hidden' : ''}${el.locked ? ', locked' : ''}">
          <span class="layer-thumb"><img src="${el.img}" alt=""></span>
          <span class="layer-text"><span class="layer-name">${esc(el.name)}</span><span class="layer-meta">${esc(methodById(el.method).label)}</span></span>
        </button>
        <button type="button" class="icon-btn sm" data-act="hide" aria-pressed="${!!el.hidden}" aria-label="${el.hidden ? 'Show' : 'Hide'} ${esc(el.name)}">${icon(el.hidden ? 'eyeOff' : 'eye', 18)}</button>
        <button type="button" class="icon-btn sm" data-act="lock" aria-pressed="${!!el.locked}" aria-label="${el.locked ? 'Unlock' : 'Lock'} ${esc(el.name)}">${icon(el.locked ? 'lock' : 'unlock', 18)}</button>
      </li>`).join('');
    $$('.layer', ul).forEach((li) => {
      const id = li.dataset.id;
      $('.layer-main', li).addEventListener('click', () => { this.select(id); if (this.mtab === 'layers') this.setMTab('canvas'); });
      $('.layer-main', li).addEventListener('keydown', (e) => {
        const items = $$('.layer-main', ul); const i = items.indexOf(e.currentTarget);
        if (e.key === 'ArrowDown' && !e.altKey) { e.preventDefault(); items[Math.min(i + 1, items.length - 1)].focus(); }
        if (e.key === 'ArrowUp' && !e.altKey) { e.preventDefault(); items[Math.max(i - 1, 0)].focus(); }
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); e.stopPropagation(); this.select(id); this.arrange(e.key === 'ArrowUp' ? 1 : -1, true); }
      });
      $$('[data-act]', li).forEach((b) => b.addEventListener('click', () => {
        const el = this.els.find((x) => x.id === id);
        if (b.dataset.act === 'hide') el.hidden = !el.hidden; else el.locked = !el.locked;
        this.renderElements(); this.renderLayers(); this.commit(b.dataset.act === 'hide' ? (el.hidden ? 'Hid artwork' : 'Showed artwork') : (el.locked ? 'Locked artwork' : 'Unlocked artwork'));
        $(`.layer[data-id="${id}"] [data-act="${b.dataset.act}"]`, ul)?.focus();
      }));
    });
    if (focus && this.selId) $(`.layer[data-id="${this.selId}"] .layer-main`, ul)?.focus();
  }

  // ───────────────────────── Properties panel ─────────────────────────
  renderProps() {
    const pane = $('#tp-art', this.root);
    if (!pane) return;
    const el = this.sel;
    if (!el) {
      pane.innerHTML = `<div class="props-empty">
        <p>Select artwork on the canvas or in the layers list to edit it.</p>
        <button type="button" class="btn btn-accent" data-add2>${icon('plus', 18)} Add artwork</button></div>`;
      $('[data-add2]', pane).addEventListener('click', () => this.addArtwork());
      return;
    }
    const box = this.L.box;
    const m = methodById(el.method);
    const usesColors = ['thin', 'thick', 'integrated'].includes(el.method);
    pane.innerHTML = `
      <div class="prop-group">
        <label class="field"><span>Name</span><input class="input" data-k="name" value="${esc(el.name)}" maxlength="60"></label>
        <button type="button" class="btn btn-primary edit-btn" data-edit>${icon('edit', 18)} Edit image</button>
      </div>
      <fieldset class="prop-group method-pick">
        <legend class="field-label">Addition method</legend>
        <div class="method-grid">
          ${METHODS.map((mm) => `<label class="method-opt">
            <input type="radio" name="method-${this.uid}" value="${mm.id}" ${mm.id === el.method ? 'checked' : ''}>
            <span class="method-card">${methodIcon(mm.id, 34)}<span>${mm.short}</span></span>
          </label>`).join('')}
        </div>
        <p class="method-desc muted">${esc(m.desc)}</p>
      </fieldset>
      ${el.method === 'patch' ? `<div class="prop-group">
        <span class="field-label" id="shape-l-${this.uid}">Patch shape</span>
        <div class="chips" role="radiogroup" aria-labelledby="shape-l-${this.uid}">
          ${PATCH_SHAPES.map((s) => `<button type="button" class="chip" role="radio" aria-checked="${(el.shape || 'rounded') === s.id}" data-shape="${s.id}">${s.label}</button>`).join('')}
        </div>
        <div class="row2">
          <label class="color-field"><input type="color" data-k="patchBg" value="${el.patchBg || '#f4f1ea'}"><span>Patch fabric</span></label>
          <label class="color-field"><input type="color" data-k="border" value="${el.border || '#1d1d1f'}"><span>Border thread</span></label>
        </div></div>` : ''}
      ${usesColors ? `<div class="prop-group">${rangeRow('colors', el.method === 'integrated' ? 'Yarn colours' : 'Thread colours', el.colors ?? m.defaults.colors, 2, 12, 1, '')}</div>` : ''}
      <div class="prop-group">
        <h3 class="field-label">Transform</h3>
        ${rangeRow('w', 'Width', Math.round(el.w), 8, Math.round(box.w * 1.1), 1, '')}
        ${rangeRow('rot', 'Rotation', Math.round(el.rot || 0), -180, 180, 1, '°')}
        ${rangeRow('opacity', 'Opacity', Math.round((el.opacity ?? 1) * 100), 10, 100, 1, '%')}
        <div class="row2">
          <label class="field"><span>X</span><input class="input" type="number" data-k="x" value="${Math.round(el.x)}" step="1"></label>
          <label class="field"><span>Y</span><input class="input" type="number" data-k="y" value="${Math.round(el.y)}" step="1"></label>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-sm" data-do="centerX">${icon('center', 16)} Centre</button>
          <button type="button" class="btn btn-sm" data-do="flip">${icon('flipH', 16)} Flip</button>
        </div>
      </div>
      <div class="prop-group">
        <h3 class="field-label">Arrange</h3>
        <div class="btn-row">
          <button type="button" class="btn btn-sm" data-do="up" title="Bring forward (])">${icon('up', 16)} Forward</button>
          <button type="button" class="btn btn-sm" data-do="down" title="Send backward ([)">${icon('down', 16)} Backward</button>
          <button type="button" class="btn btn-sm" data-do="dup" title="Duplicate (Ctrl+D)">${icon('copy', 16)} Duplicate</button>
          <button type="button" class="btn btn-sm" data-do="other">${icon('flipV', 16)} Move to ${this.view === 'front' ? (this.spec.tpl === 'shoe' ? 'inner' : 'back') : (this.spec.tpl === 'shoe' ? 'outer' : 'front')}</button>
          <button type="button" class="btn btn-sm danger-text" data-do="del" title="Delete">${icon('trash', 16)} Delete</button>
        </div>
      </div>
      ${el.credit ? `<div class="prop-group credit"><h3 class="field-label">Image credit</h3>
        <p>${esc(el.credit.title || 'Untitled')}${el.credit.creator ? ` by ${esc(el.credit.creator)}` : ''}</p>
        <p class="muted">${esc(el.credit.license || '')}${el.credit.source ? ` · ${esc(el.credit.source)}` : ''}</p>
        ${el.credit.url ? `<a href="${esc(el.credit.url)}" target="_blank" rel="noopener noreferrer">View original</a>` : ''}</div>` : ''}
    `;
    // wiring
    $('[data-edit]', pane).addEventListener('click', () => this.editImage());
    $('[data-k="name"]', pane).addEventListener('input', (e) => { el.name = e.target.value || 'Artwork'; this.renderLayersSoft(); });
    $('[data-k="name"]', pane).addEventListener('change', () => this.commit('Renamed artwork'));
    $$(`input[name="method-${this.uid}"]`, pane).forEach((r) => r.addEventListener('change', () => {
      el.method = r.value;
      const d = methodById(r.value).defaults;
      if (r.value === 'patch') { el.shape ||= d.shape; el.patchBg ||= d.patchBg; el.border ||= d.border; }
      if (d.colors && el.colors == null) el.colors = d.colors;
      this.renderElements(); this.renderLayers(); this.commit(`Method: ${methodById(r.value).label}`);
      this.renderProps();
      $(`input[name="method-${this.uid}"][value="${r.value}"]`, pane)?.focus();
      announce(`${methodById(r.value).label} applied`);
    }));
    $$('[data-shape]', pane).forEach((b) => b.addEventListener('click', () => { el.shape = b.dataset.shape; this.renderElements(); this.commit('Patch shape'); this.renderProps(); $(`[data-shape="${b.dataset.shape}"]`, pane)?.focus(); }));
    $$('input[type="color"][data-k]', pane).forEach((inp) => {
      inp.addEventListener('input', debounce(() => { el[inp.dataset.k] = inp.value; this.refreshEffect(el); }, 120));
      inp.addEventListener('change', () => { el[inp.dataset.k] = inp.value; this.refreshEffect(el); this.commit('Patch colour'); });
    });
    $$('input[type="range"][data-k]', pane).forEach((inp) => {
      const out = inp.closest('.range-row').querySelector('output');
      const k = inp.dataset.k;
      inp.addEventListener('input', () => {
        const v = +inp.value;
        out.textContent = v + (inp.dataset.unit || '');
        if (k === 'w') { const ar = el.h / el.w; el.w = v; el.h = v * ar; }
        else if (k === 'rot') el.rot = v;
        else if (k === 'opacity') el.opacity = v / 100;
        else if (k === 'colors') return;
        this.updateElTransform(el); this.drawOverlay();
      });
      inp.addEventListener('change', () => {
        if (k === 'colors') { el.colors = +inp.value; this.refreshEffect(el); }
        if (k === 'w') this.refreshEffect(el);
        this.commit({ w: 'Resized artwork', rot: 'Rotated artwork', opacity: 'Opacity', colors: 'Thread colours' }[k]);
        this.syncXY();
      });
    });
    $$('input[type="number"][data-k]', pane).forEach((inp) => inp.addEventListener('change', () => {
      el[inp.dataset.k] = +inp.value || 0; this.updateElTransform(el); this.drawOverlay(); this.commit('Moved artwork');
    }));
    $$('[data-do]', pane).forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.do;
      if (a === 'centerX') { el.x = this.L.box.x + this.L.box.w / 2; this.updateElTransform(el); this.drawOverlay(); this.commit('Centred artwork'); this.syncXY(); }
      if (a === 'flip') { el.flip = !el.flip; this.updateElTransform(el); this.commit('Flipped artwork'); }
      if (a === 'up') this.arrange(1);
      if (a === 'down') this.arrange(-1);
      if (a === 'dup') this.duplicate();
      if (a === 'del') this.remove();
      if (a === 'other') this.moveToOtherSide();
    }));
  }
  syncXY() {
    const el = this.sel; if (!el) return;
    const pane = $('#tp-art', this.root);
    const x = $('[data-k="x"]', pane), y = $('[data-k="y"]', pane);
    if (x) x.value = Math.round(el.x); if (y) y.value = Math.round(el.y);
  }
  renderLayersSoft() {
    const el = this.sel; if (!el) return;
    const n = $(`.layer[data-id="${el.id}"] .layer-name`, this.root); if (n) n.textContent = el.name;
  }

  // ───────────────────────── Garment panel ─────────────────────────
  renderGarmentPanel() {
    const pane = $('#tp-gar', this.root);
    const s = this.spec;
    const cuts = getCuts(s.type);
    const mats = getMaterials(s.type);
    const swatch = (c, name, cur) => `<button type="button" class="swatch" role="radio" aria-checked="${c.toLowerCase() === (cur || '').toLowerCase()}" data-${name}="${c}" style="--sw:${c}" aria-label="${c}"></button>`;
    const matColor = MATERIALS[this.p.sel.material]?.color;
    pane.innerHTML = `
      <div class="prop-group">
        <p class="garment-name">${esc(productName(this.p.sel))}</p>
        <p class="muted small">${esc(s.cat.label)} · ${esc(s.genre.label)}</p>
        <a class="btn btn-sm" href="#/new/${s.cat.id}/${s.genre.id}">Start a different garment</a>
      </div>
      <div class="prop-group">
        <span class="field-label" id="col-l-${this.uid}">Colour</span>
        <div class="swatches" role="radiogroup" aria-labelledby="col-l-${this.uid}">
          ${matColor && !SWATCHES.includes(matColor) ? swatch(matColor, 'color', this.p.color) : ''}
          ${SWATCHES.map((c) => swatch(c, 'color', this.p.color)).join('')}
        </div>
        <label class="color-field"><input type="color" data-pick="color" value="${this.p.color}"><span>Custom colour <code>${esc(this.p.color)}</code></span></label>
      </div>
      <div class="prop-group">
        <span class="field-label" id="acc-l-${this.uid}">${ACCENT_LABEL[s.tpl]}</span>
        <div class="swatches small" role="radiogroup" aria-labelledby="acc-l-${this.uid}">
          ${['#f2f0eb', '#1d1d1f', '#c0392b', '#2756a8', '#e8b64c', '#2f5d50', '#c48a4a', '#7d8794'].map((c) => swatch(c, 'accent', this.p.accent)).join('')}
        </div>
        <label class="color-field"><input type="color" data-pick="accent" value="${this.p.accent}"><span>Custom <code>${esc(this.p.accent)}</code></span></label>
      </div>
      <div class="prop-group">
        <label class="field"><span>Cut</span>
          <select class="select" data-sel="cut">${cuts.map((c) => `<option value="${c.id}" ${c.id === this.p.sel.cut ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label>
        <label class="field"><span>Material</span>
          <select class="select" data-sel="material">${mats.map((m) => `<option value="${m.id}" ${m.id === this.p.sel.material ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select></label>
        <p class="muted small">${esc(MATERIALS[this.p.sel.material]?.desc || '')}</p>
        ${matColor && matColor !== this.p.color ? `<button type="button" class="btn btn-sm" data-matcolor>Use ${esc(MATERIALS[this.p.sel.material].label)} colour</button>` : ''}
      </div>`;
    const setColor = (k, v, commit = true) => {
      this.p[k] = v;
      this.buildStage();
      if (commit) { this.commit(k === 'color' ? 'Garment colour' : 'Trim colour'); this.renderGarmentPanel(); $(`[data-pick="${k}"]`, pane)?.focus(); }
    };
    $$('[data-color]', pane).forEach((b) => b.addEventListener('click', () => { setColor('color', b.dataset.color); $(`[data-color="${b.dataset.color}"]`, pane)?.focus(); }));
    $$('[data-accent]', pane).forEach((b) => b.addEventListener('click', () => { setColor('accent', b.dataset.accent); $(`[data-accent="${b.dataset.accent}"]`, pane)?.focus(); }));
    $$('[data-pick]', pane).forEach((inp) => {
      inp.addEventListener('input', debounce(() => setColor(inp.dataset.pick, inp.value, false), 60));
      inp.addEventListener('change', () => setColor(inp.dataset.pick, inp.value));
    });
    $$('.swatches', pane).forEach((grp) => grp.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const items = $$('.swatch', grp); const i = items.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); const j = clamp(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); items[j].focus();
    }));
    $$('[data-sel]', pane).forEach((sel) => sel.addEventListener('change', () => {
      const oldName = productName(this.p.sel);
      this.p.sel[sel.dataset.sel] = sel.value;
      if (!this.p.customName || this.p.name === oldName) { this.p.name = productName(this.p.sel); $('#dz-name', this.root).value = this.p.name; }
      $('[data-sub]', this.root).textContent = this.subtitle();
      this.vbKey = null;
      this.buildStage(); this.commit(sel.dataset.sel === 'cut' ? 'Changed cut' : 'Changed material');
      this.renderGarmentPanel();
      $(`[data-sel="${sel.dataset.sel}"]`, pane)?.focus();
    }));
    $('[data-matcolor]', pane)?.addEventListener('click', () => setColor('color', matColor));
  }

  // ───────────────────────── Actions ─────────────────────────
  async addArtwork() {
    const { openAddArtwork } = await import('../components/add-artwork.js');
    const res = await openAddArtwork({ garmentColor: this.p.color });
    if (!res) return;
    const img = await loadImage(res.src);
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const box = this.L.box;
    const s = this.spec;
    const pl = placementFor(s, box);
    let w = pl.w, hgt = pl.w * (ih / iw);
    if (hgt > pl.maxH) { hgt = pl.maxH; w = hgt * (iw / ih); }
    const m = methodById(res.method);
    const el = {
      id: uid(), name: res.name || 'Artwork', img: res.src, orig: res.src, method: res.method, rev: 0,
      x: pl.x, y: pl.y,
      w, h: hgt, rot: 0, opacity: 1, credit: res.credit || null,
      ...(m.defaults || {}),
    };
    this.els.push(el);
    this.selId = el.id;
    this.renderElements(); this.renderLayers(); this.setTab('artwork');
    if (this.mtab !== 'canvas') this.setMTab('canvas');
    this.commit('Added artwork');
    toast(`Added “${el.name}” as ${m.label.toLowerCase()}`);
    if (res.edit) this.editImage();
  }

  async editImage() {
    const el = this.sel;
    if (!el) return;
    const { openEditor } = await import('../editor/editor.js');
    const out = await openEditor({ src: el.img, original: el.orig, name: el.name });
    if (!out) return;
    const img = await loadImage(out);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const area = el.w * el.h;
    // keep visual area roughly constant, adopt new aspect ratio
    el.w = Math.sqrt(area * (iw / ih)); el.h = el.w * (ih / iw);
    el.img = out; el.rev = (el.rev || 0) + 1;
    this.renderElements(); this.renderLayers(); this.renderProps();
    this.commit('Edited image');
    toast('Image updated');
  }

  arrange(dir, focusLayer = false) {
    const i = this.els.findIndex((e) => e.id === this.selId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= this.els.length) return;
    const arr = this.els; [arr[i], arr[j]] = [arr[j], arr[i]];
    this.renderElements(); this.renderLayers(focusLayer); this.commit(dir > 0 ? 'Brought forward' : 'Sent backward');
    announce(dir > 0 ? 'Brought forward' : 'Sent backward');
  }
  duplicate() {
    const el = this.sel; if (!el) return;
    const c = { ...el, id: uid(), name: el.name + ' copy', x: el.x + 12, y: el.y + 12, locked: false };
    this.els.push(c); this.selId = c.id;
    this.renderElements(); this.renderLayers(); this.renderProps(); this.commit('Duplicated artwork');
    announce('Artwork duplicated');
  }
  remove() {
    const el = this.sel; if (!el) return;
    const i = this.els.indexOf(el);
    this.els.splice(i, 1); this.selId = null;
    this.renderElements(); this.renderLayers(); this.renderProps(); this.commit('Deleted artwork');
    toast(`Deleted “${el.name}”`, { action: 'Undo', onAction: () => this.undo() });
  }
  moveToOtherSide() {
    const el = this.sel; if (!el) return;
    const other = this.view === 'front' ? 'back' : 'front';
    this.els.splice(this.els.indexOf(el), 1);
    this.p.views[other].push(el);
    this.commit('Moved to other side');
    this.setView(other);
    this.select(el.id);
  }

  handleKey(e) {
    if (document.querySelector('dialog[open]')) return;
    const t = e.target;
    const typing = t.matches?.('input:not([type=range]):not([type=radio]):not([type=color]), textarea, select, [contenteditable]');
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') { if (typing) return; e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { if (typing) return; e.preventDefault(); this.redo(); return; }
    if (typing) return;
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); this.duplicate(); return; }
    if (t.matches?.('input[type=range]') && e.key.startsWith('Arrow')) return;
    if (e.key === '+' || e.key === '=') { this.zoomBy(1.25); return; }
    if (e.key === '-' || e.key === '_') { this.zoomBy(0.8); return; }
    if (e.key === '0' && !mod) { this.fit(); return; }
    const el = this.sel;
    if (!el) return;
    if (e.key === 'Escape') { this.select(null); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !t.closest('.layer')) { e.preventDefault(); this.remove(); return; }
    if (e.key === 'Delete' && t.closest('.layer')) { e.preventDefault(); this.remove(); return; }
    if (e.key === 'e' || e.key === 'E') { e.preventDefault(); this.editImage(); return; }
    if (e.key === ']') { this.arrange(1); return; }
    if (e.key === '[') { this.arrange(-1); return; }
    if (e.key.startsWith('Arrow') && !t.closest('.layer') && !t.closest('[role=radiogroup], .method-grid, .tabs, .swatches')) {
      if (el.locked) return;
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') el.x -= d; if (e.key === 'ArrowRight') el.x += d;
      if (e.key === 'ArrowUp') el.y -= d; if (e.key === 'ArrowDown') el.y += d;
      this.updateElTransform(el); this.drawOverlay(); this.syncXY();
      clearTimeout(this.nudgeT); this.nudgeT = setTimeout(() => this.commit('Moved artwork'), 400);
    }
  }

  // ───────────────────────── History & persistence ─────────────────────────
  snapshot() {
    return {
      views: { front: this.p.views.front.map((e) => ({ ...e })), back: this.p.views.back.map((e) => ({ ...e })) },
      color: this.p.color, accent: this.p.accent, sel: { ...this.p.sel }, name: this.p.name,
    };
  }
  commit(label = 'Edit') {
    this.hist = this.hist.slice(0, this.hIdx + 1);
    this.hist.push({ label, s: this.snapshot() });
    if (this.hist.length > MAX_HISTORY) this.hist.shift();
    this.hIdx = this.hist.length - 1;
    this.updateHistoryButtons();
    if (this.hist.length > 1) { this.markDirty(); }
  }
  restore(s) {
    this.p.views = { front: s.views.front.map((e) => ({ ...e })), back: s.views.back.map((e) => ({ ...e })) };
    this.p.color = s.color; this.p.accent = s.accent; this.p.sel = { ...s.sel }; this.p.name = s.name;
    if (!this.sel) this.selId = null;
    $('#dz-name', this.root).value = this.p.name;
    $('[data-sub]', this.root).textContent = this.subtitle();
    this.vbKey = null;
    this.buildStage(); this.renderLayers(); this.renderProps(); this.renderGarmentPanel();
    this.markDirty();
  }
  undo() {
    if (this.hIdx <= 0) return;
    const label = this.hist[this.hIdx].label;
    this.hIdx--; this.restore(this.hist[this.hIdx].s); this.updateHistoryButtons();
    announce(`Undid ${label}`);
  }
  redo() {
    if (this.hIdx >= this.hist.length - 1) return;
    this.hIdx++; this.restore(this.hist[this.hIdx].s); this.updateHistoryButtons();
    announce(`Redid ${this.hist[this.hIdx].label}`);
  }
  updateHistoryButtons() {
    const u = $('[data-undo]', this.root), r = $('[data-redo]', this.root);
    if (!u) return;
    u.disabled = this.hIdx <= 0; r.disabled = this.hIdx >= this.hist.length - 1;
    if (this.hIdx > 0) u.title = `Undo ${this.hist[this.hIdx].label} (Ctrl+Z)`;
  }
  markDirty() {
    const s = $('[data-save]', this.root); if (s) s.textContent = 'Saving…';
    this.save(); this.thumb();
  }
  async persist() {
    try {
      await saveProject(this.p);
      const s = $('[data-save]', this.root); if (s) s.textContent = 'Saved';
    } catch (e) {
      console.error(e);
      const s = $('[data-save]', this.root); if (s) s.textContent = 'Not saved';
      toast('Could not save — storage may be full', { tone: 'error' });
    }
  }
  async makeThumb() {
    try {
      const c = await this.rasterize('front', 360, true);
      this.p.thumb = c.toDataURL('image/png');
      this.save();
    } catch (e) { /* thumbnails are best-effort */ }
  }

  // ───────────────────────── Export ─────────────────────────
  async viewSVG(view, fid = 'x' + this.uid) {
    const s = this.spec;
    const L = garmentLayers({ tpl: s.tpl, params: s.params, view, color: this.p.color, accent: this.p.accent, materialId: this.p.sel.material });
    const els = this.p.views[view];
    const urls = await Promise.all(els.map((el) => this.effectURLAsync(el)));
    const body = els.map((el, i) => this.elMarkup(el, urls[i], fid).replace(/<rect class="hit"[^>]*\/>/, '')).join('');
    return { L, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${L.viewBox}" width="${L.box.w}" height="${L.box.h}"><defs>${L.defs}${methodFilterDefs(fid)}</defs>${L.under}<g clip-path="url(#${L.clipId})">${body}</g>${L.over}</svg>` };
  }
  async rasterize(view, longSide = 1600, transparent = true) {
    const { L, svg } = await this.viewSVG(view);
    const fixed = svg.replace(/var\(--[\w-]+\)/g, '#2f6fed');
    const blob = new Blob([fixed], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = longSide / Math.max(L.box.w, L.box.h);
      const c = makeCanvas(L.box.w * k, L.box.h * k);
      const x = c.getContext('2d');
      if (!transparent) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(img, 0, 0, c.width, c.height);
      return c;
    } finally { URL.revokeObjectURL(url); }
  }
  openExport() {
    const views = viewsFor(this.spec.tpl);
    const d = openDialog({
      title: 'Export design',
      body: `<form class="export-form" data-form>
        <fieldset class="prop-group"><legend class="field-label">What</legend>
          <label class="check"><input type="radio" name="what" value="current" checked> Current side (${views.find((v) => v.id === this.view).label})</label>
          <label class="check"><input type="radio" name="what" value="both"> Both sides, side by side</label>
        </fieldset>
        <fieldset class="prop-group"><legend class="field-label">Format</legend>
          <label class="check"><input type="radio" name="fmt" value="png" checked> PNG image</label>
          <label class="check"><input type="radio" name="fmt" value="svg"> SVG (vector garment, raster artwork)</label>
          <label class="check"><input type="radio" name="fmt" value="json"> Project file (.json)</label>
        </fieldset>
        <fieldset class="prop-group" data-png-opts><legend class="field-label">PNG options</legend>
          <label class="field"><span>Size</span><select class="select" name="size"><option value="1200">1200 px</option><option value="2000" selected>2000 px</option><option value="3000">3000 px</option></select></label>
          <label class="check"><input type="checkbox" name="white"> White background</label>
        </fieldset>
      </form>`,
      actions: `<button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-primary" data-go>${icon('download', 18)} Download</button>`,
    });
    const form = $('[data-form]', d.el);
    form.addEventListener('change', () => { $('[data-png-opts]', form).hidden = form.fmt.value !== 'png'; });
    $('[data-go]', d.el).addEventListener('click', async () => {
      const btn = $('[data-go]', d.el); btn.disabled = true; btn.textContent = 'Preparing…';
      try { await this.doExport(form.what.value, form.fmt.value, +form.size.value, form.white.checked); d.close(); toast('Export ready'); }
      catch (e) { console.error(e); toast('Export failed: ' + e.message, { tone: 'error' }); btn.disabled = false; btn.textContent = 'Download'; }
    });
  }
  async doExport(what, fmt, size, white) {
    const base = (this.p.name || 'design').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'design';
    const sides = what === 'both' ? ['front', 'back'] : [this.view];
    if (fmt === 'json') {
      downloadBlob(new Blob([JSON.stringify({ app: 'atelier', version: 1, project: { ...this.p, thumb: null } })], { type: 'application/json' }), `${base}.atelier.json`);
      return;
    }
    if (fmt === 'svg') {
      for (const v of sides) {
        const { svg } = await this.viewSVG(v);
        downloadBlob(new Blob([svg.replace(/var\(--[\w-]+\)/g, '#2f6fed')], { type: 'image/svg+xml' }), `${base}-${v}.svg`);
      }
      return;
    }
    const canvases = [];
    for (const v of sides) canvases.push(await this.rasterize(v, size, !white));
    let out = canvases[0];
    if (canvases.length > 1) {
      const gap = Math.round(size * 0.04);
      out = makeCanvas(canvases.reduce((a, c) => a + c.width, 0) + gap, Math.max(...canvases.map((c) => c.height)));
      const x = out.getContext('2d');
      if (white) { x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height); }
      let ox = 0; for (const c of canvases) { x.drawImage(c, ox, (out.height - c.height) / 2); ox += c.width + gap; }
    }
    const blob = await new Promise((res) => out.toBlob(res, 'image/png'));
    if (!blob) throw new Error('Could not encode PNG');
    downloadBlob(blob, `${base}-${what === 'both' ? 'front-back' : this.view}.png`);
  }
}

/** Sensible default position/size for new artwork on each garment family. */
function placementFor(s, box) {
  const p = s.params;
  if (s.tpl === 'top') {
    const w = p.w || 96, len = p.len || 410;
    const strapTop = p.straps === 'thin' || p.straps === 'none' || p.straps === 'halter';
    const y = strapTop ? 96 + 74 + (len - 170) * 0.3 : 96 + (len - 96) * 0.3 + (p.neck === 'hood' ? 14 : 0);
    return { x: 200, y, w: w * 0.95, maxH: (len - 96) * 0.45 };
  }
  if (s.tpl === 'bottom') {
    const hw = p.hipW || 104;
    if (p.kind === 'skirt') return { x: 200, y: 40 + 150, w: hw * 0.9, maxH: 140 };
    return { x: 200 - hw / 2, y: 40 + (p.rise || 200) + 50, w: Math.min(70, (p.thigh || 52) * 1.2), maxH: 90 };
  }
  if (s.tpl === 'hat') {
    const ch = p.crownH || 110;
    if (['bandana', 'headband', 'balaclava'].includes(p.kind)) return { x: 200, y: p.kind === 'bandana' ? 200 : 180, w: 90, maxH: 80 };
    return { x: 200, y: 240 - ch * 0.48, w: (p.crownW || 130) * 0.75, maxH: ch * 0.62 };
  }
  // shoe: side panel
  return { x: 236, y: 330 - (p.sole || 26) - 46, w: 104, maxH: 56 };
}

function rangeRow(k, label, val, min, max, step, unit) {
  const id = 'r-' + k + '-' + Math.random().toString(36).slice(2, 7);
  return `<div class="range-row"><label for="${id}">${label}</label><output for="${id}">${val}${unit}</output>
    <input id="${id}" type="range" data-k="${k}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
}
const r2 = (n) => Math.round(n * 100) / 100;
function normAngle(a) { a = ((a + 180) % 360 + 360) % 360 - 180; return Math.round(a * 10) / 10; }
