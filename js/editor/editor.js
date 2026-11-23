// Pop-out, Photoshop-style image editor.
import { esc, icon, $, $$, clamp, debounce, announce, toast, confirmDialog, h } from '../lib/dom.js';
import { loadImage, makeCanvas, ctx2d, cloneCanvas, imageToCanvas, trimTransparent, downloadBlob } from '../lib/image.js';
import { PRESETS, applyPreset } from './filters.js';
import { floodMask, maskToCanvas, canvasToMask, maskBounds, traceLoops, loopsToPath2D } from './selection.js';
import { vectorize, rasterizeVector } from './vectorize.js';
import { prefs } from '../lib/store.js';

const TOOLS = [
  { id: 'hand', label: 'Hand (pan)', key: 'H', icon: 'hand' },
  { id: 'rect', label: 'Rectangle select', key: 'M', icon: 'rectSel' },
  { id: 'ellipse', label: 'Ellipse select', key: 'U', icon: 'ellipseSel' },
  { id: 'lasso', label: 'Lasso select', key: 'L', icon: 'lasso' },
  { id: 'wand', label: 'Magic wand', key: 'W', icon: 'wand' },
  { id: 'crop', label: 'Crop', key: 'C', icon: 'crop' },
  { id: 'brush', label: 'Brush', key: 'B', icon: 'brush' },
  { id: 'eraser', label: 'Eraser', key: 'E', icon: 'eraser' },
  { id: 'fill', label: 'Paint bucket', key: 'G', icon: 'bucket' },
  { id: 'picker', label: 'Eyedropper', key: 'I', icon: 'dropper' },
];
const SIDE_TABS = [
  { id: 'filters', label: 'Filters', icon: 'filter' },
  { id: 'transform', label: 'Transform', icon: 'rotR' },
  { id: 'vector', label: 'Vectorize', icon: 'vector' },
  { id: 'history', label: 'History', icon: 'history' },
];
const MAX_DOC = 1600;
const MAX_HIST = 30;

export async function openEditor({ src, original, name = 'Artwork' }) {
  const img = await loadImage(src);
  return new Promise((resolve) => { new Editor(img, { original, name }, resolve); });
}

class Editor {
  constructor(img, { original, name }, resolve) {
    this.resolve = resolve;
    this.name = name;
    this.original = original;
    this.doc = imageToCanvas(img, MAX_DOC);
    this.sel = null;
    this.preview = null;
    this.previewLabel = '';
    this.hist = [];
    this.hi = -1;
    this.z = 1; this.tx = 0; this.ty = 0;
    this.pointers = new Map();
    this.o = {
      tool: 'brush', mode: 'new', tol: 24, contiguous: true,
      color: prefs.get('edColor', '#e0603c'), size: 24, hardness: 0.75, opacity: 1,
      eSize: 36, eHardness: 0.6, fillTol: 24, fillContig: true, aspect: 'free',
      ...prefs.get('edOpts', {}),
    };
    this.o.tool = 'brush';
    this.sideTab = 'filters';
    this.filter = { id: null, amount: 100 };
    this.vec = { colors: 6, detail: 0.6, smooth: true, removeBg: false, speckle: 12, last: null };
    this.rotAngle = 0;
    this.build();
    this.push('Open image');
    requestAnimationFrame(() => { this.fit(); this.render(); });
  }

  // ───────────────────────── DOM ─────────────────────────
  build() {
    const d = h(`<dialog class="editor-dialog" aria-labelledby="ed-title">
      <div class="ed">
        <header class="ed-top" data-drag>
          <div class="ed-title-wrap"><h2 id="ed-title" class="ed-title">Edit image</h2><span class="ed-name">${esc(this.name)}</span></div>
          <div class="ed-top-actions">
            <button type="button" class="icon-btn sm" data-undo aria-label="Undo" title="Undo (Ctrl+Z)">${icon('undo', 18)}</button>
            <button type="button" class="icon-btn sm" data-redo aria-label="Redo" title="Redo (Ctrl+Shift+Z)">${icon('redo', 18)}</button>
            <span class="ed-zoom" aria-live="off" data-zoomlabel>100%</span>
            <button type="button" class="icon-btn sm hide-sm" data-max aria-label="Maximise editor" aria-pressed="false" title="Maximise">${icon('maximize', 18)}</button>
            <button type="button" class="btn btn-sm btn-ghost" data-cancel>Cancel</button>
            <button type="button" class="btn btn-sm btn-primary" data-apply>${icon('check', 16)} Apply</button>
          </div>
        </header>
        <div class="ed-options" role="toolbar" aria-label="Tool options" data-options></div>
        <div class="ed-main">
          <div class="ed-tools" role="toolbar" aria-label="Tools" aria-orientation="vertical" data-tools>
            ${TOOLS.map((t) => `<button type="button" class="icon-btn ed-tool" data-tool="${t.id}" aria-pressed="false" aria-label="${t.label} (${t.key})" title="${t.label} (${t.key})">${icon(t.icon, 20)}</button>`).join('')}
            <span class="ed-tools-sep" aria-hidden="true"></span>
            <label class="ed-swatch" title="Paint colour"><span class="sr-only">Paint colour</span><input type="color" data-color value="${this.o.color}"></label>
          </div>
          <div class="ed-viewport" data-vp role="img" aria-label="Image canvas">
            <div class="ed-checker" data-checker></div>
            <canvas class="ed-view" data-view></canvas>
            <canvas class="ed-over" data-over aria-hidden="true"></canvas>
            <div class="ed-preview-badge" data-pbadge hidden></div>
            <div class="ed-zoomctl" role="group" aria-label="Zoom">
              <button type="button" class="icon-btn sm" data-z="out" aria-label="Zoom out">${icon('zoomOut', 18)}</button>
              <button type="button" class="icon-btn sm" data-z="fit" aria-label="Fit image">${icon('fit', 18)}</button>
              <button type="button" class="icon-btn sm" data-z="in" aria-label="Zoom in">${icon('zoomIn', 18)}</button>
            </div>
          </div>
          <aside class="ed-side" data-side aria-label="Adjustments">
            <div class="ed-side-tabs" role="tablist" aria-label="Adjustment panels">
              ${SIDE_TABS.map((t) => `<button type="button" role="tab" id="est-${t.id}" aria-controls="esp-${t.id}" data-stab="${t.id}" aria-selected="false">${icon(t.icon, 16)}<span>${t.label}</span></button>`).join('')}
            </div>
            ${SIDE_TABS.map((t) => `<div class="ed-side-panel" role="tabpanel" id="esp-${t.id}" aria-labelledby="est-${t.id}" data-spanel="${t.id}" hidden></div>`).join('')}
          </aside>
        </div>
        <nav class="ed-mbar" aria-label="Editor panels">
          ${SIDE_TABS.map((t) => `<button type="button" data-msheet="${t.id}">${icon(t.icon, 18)}<span>${t.label}</span></button>`).join('')}
        </nav>
      </div>
    </dialog>`);
    document.body.appendChild(d);
    this.dlg = d;
    this.vp = $('[data-vp]', d);
    this.viewC = $('[data-view]', d);
    this.overC = $('[data-over]', d);
    this.checker = $('[data-checker]', d);
    d.showModal();
    this.prevFocus = document.activeElement;
    this.wire();
    this.setTool('brush', false);
    this.setSideTab('filters');
    this.ro = new ResizeObserver(() => { this.sizeOverlay(); this.render(); });
    this.ro.observe(this.vp);
    this.sizeOverlay();
    announce('Image editor opened. Press question mark for shortcuts.');
  }

  wire() {
    const d = this.dlg;
    d.addEventListener('cancel', (e) => { e.preventDefault(); if (this.crop) { this.cancelCrop(); return; } if (this.preview) { this.clearPreview(); return; } this.cancel(); });
    $('[data-cancel]', d).addEventListener('click', () => this.cancel());
    $('[data-apply]', d).addEventListener('click', () => this.apply());
    $('[data-undo]', d).addEventListener('click', () => this.undo());
    $('[data-redo]', d).addEventListener('click', () => this.redo());
    $('[data-max]', d).addEventListener('click', (e) => {
      const on = !d.classList.contains('maxed');
      d.classList.toggle('maxed', on);
      d.style.left = d.style.top = d.style.right = d.style.bottom = ''; d.style.margin = '';
      e.currentTarget.setAttribute('aria-pressed', on);
      e.currentTarget.innerHTML = icon(on ? 'minimize' : 'maximize', 18);
      e.currentTarget.setAttribute('aria-label', on ? 'Restore editor size' : 'Maximise editor');
    });
    $$('[data-tool]', d).forEach((b) => b.addEventListener('click', () => this.setTool(b.dataset.tool)));
    $('[data-tools]', d).addEventListener('keydown', (e) => {
      const items = $$('[data-tool]', d); const i = items.indexOf(document.activeElement); if (i < 0) return;
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    $('[data-color]', d).addEventListener('input', (e) => this.setColor(e.target.value));
    $$('[data-stab]', d).forEach((b) => b.addEventListener('click', () => this.setSideTab(b.dataset.stab)));
    $('.ed-side-tabs', d).addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = $$('[data-stab]', d); const i = tabs.indexOf(document.activeElement);
      const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[j].focus(); this.setSideTab(tabs[j].dataset.stab);
    });
    $$('[data-msheet]', d).forEach((b) => b.addEventListener('click', () => {
      const open = d.dataset.sheet === b.dataset.msheet;
      if (open) delete d.dataset.sheet; else { d.dataset.sheet = b.dataset.msheet; this.setSideTab(b.dataset.msheet); }
      $$('[data-msheet]', d).forEach((x) => x.setAttribute('aria-pressed', d.dataset.sheet === x.dataset.msheet));
    }));
    $$('[data-z]', d).forEach((b) => b.addEventListener('click', () => {
      const z = b.dataset.z;
      if (z === 'fit') this.fit(); else this.zoomAt(z === 'in' ? 1.25 : 0.8);
      this.render();
    }));
    // canvas pointer events
    const vp = this.vp;
    vp.addEventListener('pointerdown', (e) => this.down(e));
    vp.addEventListener('pointermove', (e) => this.move(e));
    vp.addEventListener('pointerup', (e) => this.up(e));
    vp.addEventListener('pointercancel', (e) => this.up(e));
    vp.addEventListener('pointerleave', () => { this.hover = null; this.drawOverlay(); });
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = vp.getBoundingClientRect();
        this.zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      } else { this.tx -= e.deltaX; this.ty -= e.deltaY; }
      this.render();
    }, { passive: false });
    d.addEventListener('keydown', (e) => this.key(e));
    d.addEventListener('keyup', (e) => { if (e.key === ' ') { this.space = false; this.updateCursor(); } });
    // drag window by header
    const head = $('[data-drag]', d);
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input') || d.classList.contains('maxed') || matchMedia('(max-width: 760px)').matches) return;
      const r = d.getBoundingClientRect();
      const off = { x: e.clientX - r.left, y: e.clientY - r.top };
      head.setPointerCapture(e.pointerId);
      const mv = (ev) => {
        d.style.margin = '0'; d.style.right = 'auto'; d.style.bottom = 'auto';
        d.style.left = clamp(ev.clientX - off.x, 8 - r.width + 120, innerWidth - 120) + 'px';
        d.style.top = clamp(ev.clientY - off.y, 0, innerHeight - 60) + 'px';
      };
      const upd = () => { head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', upd); };
      head.addEventListener('pointermove', mv); head.addEventListener('pointerup', upd);
    });
  }

  close(result) {
    if (this.closed) return; this.closed = true;
    cancelAnimationFrame(this.antsRAF);
    this.ro?.disconnect();
    try { this.dlg.close(); } catch { /* */ }
    this.dlg.remove();
    prefs.set('edOpts', { size: this.o.size, hardness: this.o.hardness, opacity: this.o.opacity, eSize: this.o.eSize, tol: this.o.tol, fillTol: this.o.fillTol });
    if (this.prevFocus?.focus && document.contains(this.prevFocus)) this.prevFocus.focus();
    this.resolve(result);
  }
  async cancel() {
    if (this.hist.length > 1 || this.preview) {
      if (!(await confirmDialog('Discard your changes to this image?', { okLabel: 'Discard', danger: true, title: 'Discard changes' }))) return;
    }
    this.close(null);
  }
  apply() {
    if (this.crop) this.applyCrop();
    if (this.preview) this.commitPreview();
    const out = trimTransparent(this.doc);
    if (out.width < 2 || out.height < 2) { toast('The image is empty — nothing to apply', { tone: 'error' }); return; }
    const d = ctx2d(out).getImageData(0, 0, out.width, out.height).data;
    let any = false; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) { any = true; break; }
    if (!any) { toast('The image is fully transparent — nothing to apply', { tone: 'error' }); return; }
    this.close(out.toDataURL('image/png'));
  }

  // ───────────────────────── View ─────────────────────────
  sizeOverlay() {
    const r = this.vp.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.overC.width = Math.max(1, Math.round(r.width * dpr));
    this.overC.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr; this.vw = r.width; this.vh = r.height;
  }
  fit() {
    const r = this.vp.getBoundingClientRect();
    const pad = r.width < 500 ? 16 : 40;
    const W = this.doc.width, H = this.doc.height;
    this.z = Math.min((r.width - pad * 2) / W, (r.height - pad * 2) / H, 4);
    if (!isFinite(this.z) || this.z <= 0) this.z = 1;
    this.tx = (r.width - W * this.z) / 2; this.ty = (r.height - H * this.z) / 2;
    this.render();
  }
  zoomAt(f, sx, sy) {
    if (sx == null) { sx = this.vw / 2; sy = this.vh / 2; }
    const nz = clamp(this.z * f, 0.05, 32);
    const k = nz / this.z;
    this.tx = sx - (sx - this.tx) * k; this.ty = sy - (sy - this.ty) * k; this.z = nz;
  }
  toDoc(e) {
    const r = this.vp.getBoundingClientRect();
    return { x: (e.clientX - r.left - this.tx) / this.z, y: (e.clientY - r.top - this.ty) / this.z, sx: e.clientX - r.left, sy: e.clientY - r.top };
  }
  render() {
    const src = this.preview || this.doc;
    if (this.viewC.width !== src.width || this.viewC.height !== src.height) { this.viewC.width = src.width; this.viewC.height = src.height; }
    const x = this.viewC.getContext('2d');
    x.clearRect(0, 0, src.width, src.height);
    x.drawImage(src, 0, 0);
    const t = `translate(${this.tx}px, ${this.ty}px) scale(${this.z})`;
    this.viewC.style.transform = t;
    this.viewC.style.imageRendering = this.z >= 2 ? 'pixelated' : 'auto';
    this.checker.style.transform = `translate(${this.tx}px, ${this.ty}px)`;
    this.checker.style.width = src.width * this.z + 'px';
    this.checker.style.height = src.height * this.z + 'px';
    $('[data-zoomlabel]', this.dlg).textContent = Math.round(this.z * 100) + '%';
    this.vp.setAttribute('aria-label', `Image canvas, ${this.doc.width} by ${this.doc.height} pixels${this.sel ? ', with a selection' : ''}`);
    const pb = $('[data-pbadge]', this.dlg);
    pb.hidden = !this.preview; if (this.preview) pb.textContent = `Previewing: ${this.previewLabel}`;
    this.drawOverlay();
  }
  drawOverlay() {
    const c = this.overC, x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, c.width, c.height);
    x.setTransform(this.dpr * this.z, 0, 0, this.dpr * this.z, this.dpr * this.tx, this.dpr * this.ty);
    const px = 1 / this.z;
    // document border
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = px; x.strokeRect(0, 0, this.doc.width, this.doc.height);
    // selection ants
    if (this.sel && !this.crop) {
      x.lineWidth = 1.2 * px;
      x.setLineDash([]); x.strokeStyle = '#fff'; x.stroke(this.sel.path);
      x.setLineDash([5 * px, 4 * px]); x.lineDashOffset = -(this.antsOff || 0) * px; x.strokeStyle = '#111'; x.stroke(this.sel.path);
      x.setLineDash([]);
    }
    // in-progress selection shapes
    const g = this.g;
    if (g && (g.kind === 'rect' || g.kind === 'ellipse') && g.p1) {
      const r = normRect(g.p0, g.p1);
      x.beginPath();
      if (g.kind === 'rect') x.rect(r.x, r.y, r.w, r.h); else x.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      x.lineWidth = 1.2 * px; x.strokeStyle = '#fff'; x.stroke(); x.setLineDash([5 * px, 4 * px]); x.strokeStyle = '#111'; x.stroke(); x.setLineDash([]);
    }
    if (g && g.kind === 'lasso' && g.pts.length > 1) {
      x.beginPath(); x.moveTo(g.pts[0].x, g.pts[0].y); for (const p of g.pts) x.lineTo(p.x, p.y);
      x.lineWidth = 1.2 * px; x.strokeStyle = '#fff'; x.stroke(); x.setLineDash([5 * px, 4 * px]); x.strokeStyle = '#111'; x.stroke(); x.setLineDash([]);
    }
    // crop
    if (this.crop) {
      const cr = this.crop, W = this.doc.width, H = this.doc.height;
      x.fillStyle = 'rgba(10,10,12,0.55)';
      x.beginPath(); x.rect(-1e4, -1e4, 2e4 + W, 2e4 + H); x.rect(cr.x, cr.y, cr.w, cr.h); x.fill('evenodd');
      x.strokeStyle = '#fff'; x.lineWidth = 1.5 * px; x.strokeRect(cr.x, cr.y, cr.w, cr.h);
      x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = px;
      for (const t of [1 / 3, 2 / 3]) {
        x.beginPath(); x.moveTo(cr.x + cr.w * t, cr.y); x.lineTo(cr.x + cr.w * t, cr.y + cr.h); x.stroke();
        x.beginPath(); x.moveTo(cr.x, cr.y + cr.h * t); x.lineTo(cr.x + cr.w, cr.y + cr.h * t); x.stroke();
      }
      const hs = 10 * px;
      x.fillStyle = '#fff'; x.strokeStyle = '#111'; x.lineWidth = px;
      for (const [hx, hy] of cropHandles(cr)) { x.fillRect(hx - hs / 2, hy - hs / 2, hs, hs); x.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs); }
    }
    // brush cursor
    if (this.hover && (this.o.tool === 'brush' || this.o.tool === 'eraser')) {
      const r = (this.o.tool === 'brush' ? this.o.size : this.o.eSize) / 2;
      x.beginPath(); x.arc(this.hover.x, this.hover.y, r, 0, Math.PI * 2);
      x.lineWidth = 1.5 * px; x.strokeStyle = 'rgba(255,255,255,0.9)'; x.stroke();
      x.lineWidth = 0.75 * px; x.strokeStyle = 'rgba(0,0,0,0.9)'; x.stroke();
    }
  }
  startAnts() {
    cancelAnimationFrame(this.antsRAF);
    let last = 0;
    const tick = (t) => {
      if (!this.sel || this.closed) return;
      if (t - last > 70 && !matchMedia('(prefers-reduced-motion: reduce)').matches) { this.antsOff = ((this.antsOff || 0) + 1) % 9; last = t; this.drawOverlay(); }
      this.antsRAF = requestAnimationFrame(tick);
    };
    this.antsRAF = requestAnimationFrame(tick);
  }
  updateCursor() {
    const t = this.o.tool;
    this.vp.dataset.cursor = this.space || t === 'hand' ? 'grab' : t === 'picker' ? 'picker' : t === 'brush' || t === 'eraser' ? 'none' : t === 'fill' ? 'cell' : 'crosshair';
  }

  // ───────────────────────── Tools & options ─────────────────────────
  setTool(id, ann = true) {
    if (this.crop && id !== 'crop') this.cancelCrop();
    this.o.tool = id;
    $$('[data-tool]', this.dlg).forEach((b) => { const on = b.dataset.tool === id; b.setAttribute('aria-pressed', on); b.tabIndex = on ? 0 : -1; });
    if (id === 'crop') this.startCrop();
    this.renderOptions();
    this.updateCursor();
    this.drawOverlay();
    if (ann) announce(TOOLS.find((t) => t.id === id).label + ' tool');
  }
  setColor(c) {
    this.o.color = c; prefs.set('edColor', c);
    $$('[data-color], [data-opt-color]', this.dlg).forEach((i) => { i.value = c; });
  }
  renderOptions() {
    const o = this.o, t = o.tool;
    const el = $('[data-options]', this.dlg);
    const rng = (k, label, v, min, max, step, unit = '') => `<label class="opt-range"><span>${label}</span><input type="range" data-o="${k}" min="${min}" max="${max}" step="${step}" value="${v}"><output>${v}${unit}</output></label>`;
    const selActions = `<span class="opt-sep"></span>
      <button type="button" class="btn btn-sm btn-ghost" data-sa="all" title="Select all (Ctrl+A)">${icon('selectAll', 16)}<span>All</span></button>
      <button type="button" class="btn btn-sm btn-ghost" data-sa="none" ${this.sel ? '' : 'disabled'} title="Deselect (Ctrl+D)">${icon('deselect', 16)}<span>Deselect</span></button>
      <button type="button" class="btn btn-sm btn-ghost" data-sa="invert" ${this.sel ? '' : 'disabled'} title="Invert (Ctrl+Shift+I)">${icon('invert', 16)}<span>Invert</span></button>
      <button type="button" class="btn btn-sm btn-ghost" data-sa="delete" ${this.sel ? '' : 'disabled'} title="Delete pixels (Delete)">${icon('trash', 16)}<span>Delete</span></button>
      <button type="button" class="btn btn-sm btn-ghost" data-sa="fill" ${this.sel ? '' : 'disabled'} title="Fill with colour">${icon('bucket', 16)}<span>Fill</span></button>
      <button type="button" class="btn btn-sm btn-ghost" data-sa="crop" ${this.sel ? '' : 'disabled'} title="Crop to selection">${icon('crop', 16)}<span>Crop to selection</span></button>`;
    const modeSeg = `<div class="seg seg-sm" role="group" aria-label="Selection mode">${[['new', 'New'], ['add', 'Add'], ['sub', 'Subtract'], ['int', 'Intersect']].map(([k, l]) => `<button type="button" data-mode="${k}" aria-pressed="${o.mode === k}" title="${l}${k === 'add' ? ' (hold Shift)' : k === 'sub' ? ' (hold Alt)' : ''}">${l}</button>`).join('')}</div>`;
    let html = `<span class="opt-tool">${esc(TOOLS.find((x) => x.id === t).label)}</span>`;
    if (t === 'hand') html += `<span class="muted small">Drag to pan · Ctrl/⌘ + scroll or pinch to zoom · Space+drag pans with any tool</span><button type="button" class="btn btn-sm btn-ghost" data-fit>${icon('fit', 16)}<span>Fit</span></button>`;
    if (['rect', 'ellipse', 'lasso'].includes(t)) html += modeSeg + selActions;
    if (t === 'wand') html += modeSeg + rng('tol', 'Tolerance', o.tol, 0, 100, 1) + `<label class="check opt-check"><input type="checkbox" data-o="contiguous" ${o.contiguous ? 'checked' : ''}> Contiguous</label>` + selActions;
    if (t === 'brush') html += `<label class="opt-color"><span>Colour</span><input type="color" data-opt-color value="${o.color}"></label>` + rng('size', 'Size', o.size, 1, 300, 1, 'px') + rng('hardness', 'Hardness', Math.round(o.hardness * 100), 0, 100, 1, '%') + rng('opacity', 'Opacity', Math.round(o.opacity * 100), 1, 100, 1, '%') + (this.sel ? '<span class="muted small">Painting is limited to the selection</span>' : '');
    if (t === 'eraser') html += rng('eSize', 'Size', o.eSize, 1, 300, 1, 'px') + rng('eHardness', 'Hardness', Math.round(o.eHardness * 100), 0, 100, 1, '%') + (this.sel ? '<span class="muted small">Erasing is limited to the selection</span>' : '');
    if (t === 'fill') html += `<label class="opt-color"><span>Colour</span><input type="color" data-opt-color value="${o.color}"></label>` + rng('fillTol', 'Tolerance', o.fillTol, 0, 100, 1) + `<label class="check opt-check"><input type="checkbox" data-o="fillContig" ${o.fillContig ? 'checked' : ''}> Contiguous</label>`;
    if (t === 'picker') html += `<span class="muted small">Click the image to pick a colour</span><span class="picked" style="--c:${o.color}" aria-label="Current colour ${o.color}"></span><code>${o.color}</code>`;
    if (t === 'crop') html += `<label class="opt-select"><span>Aspect</span><select class="select" data-o="aspect">${[['free', 'Free'], ['orig', 'Original'], ['1', 'Square 1:1'], ['1.3333', '4:3'], ['0.75', '3:4'], ['1.7778', '16:9'], ['0.5625', '9:16'], ['1.5', '3:2']].map(([v, l]) => `<option value="${v}" ${o.aspect === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button type="button" class="btn btn-sm btn-primary" data-crop-apply>${icon('check', 16)}<span>Apply crop</span></button>
      <button type="button" class="btn btn-sm btn-ghost" data-crop-cancel>Cancel</button><span class="muted small hide-sm">Enter to apply · Esc to cancel</span>`;
    el.innerHTML = html;
    $$('[data-o]', el).forEach((inp) => {
      const k = inp.dataset.o;
      const ev = inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input';
      inp.addEventListener(ev, () => {
        let v = inp.type === 'checkbox' ? inp.checked : inp.tagName === 'SELECT' ? inp.value : +inp.value;
        if (k === 'hardness' || k === 'eHardness' || k === 'opacity') v = v / 100;
        this.o[k] = v;
        const out = inp.parentElement.querySelector('output');
        if (out) out.textContent = inp.value + (k.toLowerCase().includes('size') ? 'px' : ['hardness', 'eHardness', 'opacity'].includes(k) ? '%' : '');
        if (k === 'aspect' && this.crop) { this.constrainCrop(); this.drawOverlay(); }
        this.drawOverlay();
      });
    });
    $$('[data-mode]', el).forEach((b) => b.addEventListener('click', () => { this.o.mode = b.dataset.mode; $$('[data-mode]', el).forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    $$('[data-sa]', el).forEach((b) => b.addEventListener('click', () => this.selAction(b.dataset.sa)));
    $('[data-opt-color]', el)?.addEventListener('input', (e) => this.setColor(e.target.value));
    $('[data-fit]', el)?.addEventListener('click', () => this.fit());
    $('[data-crop-apply]', el)?.addEventListener('click', () => this.applyCrop());
    $('[data-crop-cancel]', el)?.addEventListener('click', () => { this.cancelCrop(); this.setTool('rect'); });
  }

  // ───────────────────────── Pointer handling ─────────────────────────
  down(e) {
    if (e.button === 2) return;
    this.vp.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      if (this.g?.kind === 'paint') this.endPaint(true);
      const [a, b] = [...this.pointers.values()];
      const r = this.vp.getBoundingClientRect();
      this.g = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), z0: this.z, tx0: this.tx, ty0: this.ty, m0: { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top } };
      return;
    }
    const p = this.toDoc(e);
    const t = this.o.tool;
    if (this.space || t === 'hand' || e.button === 1) { this.g = { kind: 'pan', sx: e.clientX, sy: e.clientY, tx0: this.tx, ty0: this.ty }; this.vp.dataset.cursor = 'grabbing'; return; }
    if (this.preview && t !== 'crop') { toast('Apply or cancel the preview first', { timeout: 2000 }); return; }
    const mode = e.shiftKey && e.altKey ? 'int' : e.shiftKey ? 'add' : e.altKey ? 'sub' : this.o.mode;
    if (t === 'rect' || t === 'ellipse') this.g = { kind: t, p0: p, p1: null, mode };
    else if (t === 'lasso') this.g = { kind: 'lasso', pts: [p], mode };
    else if (t === 'wand') this.wandAt(p, mode);
    else if (t === 'brush' || t === 'eraser') this.startPaint(p);
    else if (t === 'fill') this.fillAt(p);
    else if (t === 'picker') this.pickAt(p);
    else if (t === 'crop') this.cropDown(p);
  }
  move(e) {
    const p = this.toDoc(e);
    if (e.pointerType !== 'touch') this.hover = p;
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = this.g;
    if (!g) { if (this.o.tool === 'brush' || this.o.tool === 'eraser') this.drawOverlay(); else if (this.o.tool === 'crop') this.cropHover(p); return; }
    if (g.kind === 'pinch' && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const r = this.vp.getBoundingClientRect();
      const m = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      const nz = clamp(g.z0 * Math.hypot(a.x - b.x, a.y - b.y) / (g.d0 || 1), 0.05, 32);
      const k = nz / g.z0;
      this.z = nz; this.tx = m.x - (g.m0.x - g.tx0) * k; this.ty = m.y - (g.m0.y - g.ty0) * k;
      this.render(); return;
    }
    if (g.kind === 'pan') { this.tx = g.tx0 + e.clientX - g.sx; this.ty = g.ty0 + e.clientY - g.sy; this.render(); return; }
    if (g.kind === 'rect' || g.kind === 'ellipse') {
      let p1 = p;
      if (e.shiftKey && g.mode !== 'add') { const s = Math.max(Math.abs(p.x - g.p0.x), Math.abs(p.y - g.p0.y)); p1 = { x: g.p0.x + Math.sign(p.x - g.p0.x) * s, y: g.p0.y + Math.sign(p.y - g.p0.y) * s }; }
      g.p1 = p1; this.drawOverlay(); return;
    }
    if (g.kind === 'lasso') { const l = g.pts[g.pts.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) * this.z > 2) g.pts.push(p); this.drawOverlay(); return; }
    if (g.kind === 'paint') { this.paintTo(p); return; }
    if (g.kind === 'crop') { this.cropDrag(p, e); return; }
  }
  up(e) {
    this.pointers.delete(e.pointerId);
    const g = this.g;
    if (!g) return;
    if (g.kind === 'pinch') { if (this.pointers.size === 0) this.g = null; return; }
    if (g.kind === 'pan') { this.g = null; this.updateCursor(); return; }
    if (g.kind === 'rect' || g.kind === 'ellipse') {
      this.g = null;
      if (!g.p1 || (Math.abs(g.p1.x - g.p0.x) < 2 && Math.abs(g.p1.y - g.p0.y) < 2)) { if (g.mode === 'new') this.setSelection(null, 'Deselect'); this.drawOverlay(); return; }
      const r = normRect(g.p0, g.p1);
      const m = makeCanvas(this.doc.width, this.doc.height), x = m.getContext('2d');
      x.fillStyle = '#fff'; x.beginPath();
      if (g.kind === 'rect') x.rect(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h)); else x.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      x.fill();
      this.combine(m, g.mode, g.kind === 'rect' ? 'Rectangle select' : 'Ellipse select');
      return;
    }
    if (g.kind === 'lasso') {
      this.g = null;
      if (g.pts.length < 3) { this.drawOverlay(); return; }
      const m = makeCanvas(this.doc.width, this.doc.height), x = m.getContext('2d');
      x.fillStyle = '#fff'; x.beginPath(); x.moveTo(g.pts[0].x, g.pts[0].y); for (const q of g.pts) x.lineTo(q.x, q.y); x.closePath(); x.fill();
      this.combine(m, g.mode, 'Lasso select');
      return;
    }
    if (g.kind === 'paint') { this.endPaint(); return; }
    if (g.kind === 'crop') { this.g = null; this.drawOverlay(); return; }
    this.g = null;
  }

  // ───────────────────────── Selection ─────────────────────────
  combine(shape, mode, label) {
    const W = this.doc.width, H = this.doc.height;
    const out = makeCanvas(W, H), x = out.getContext('2d');
    if (mode === 'new' || (!this.sel && mode !== 'int')) x.drawImage(shape, 0, 0);
    else if (mode === 'add') { x.drawImage(this.sel.canvas, 0, 0); x.drawImage(shape, 0, 0); }
    else if (mode === 'sub') { if (!this.sel) return; x.drawImage(this.sel.canvas, 0, 0); x.globalCompositeOperation = 'destination-out'; x.drawImage(shape, 0, 0); }
    else if (mode === 'int') { if (this.sel) { x.drawImage(this.sel.canvas, 0, 0); x.globalCompositeOperation = 'destination-in'; } x.drawImage(shape, 0, 0); }
    this.setSelection(out, label);
  }
  setSelection(canvas, label = 'Selection', record = true) {
    if (!canvas) {
      if (!this.sel) return;
      this.sel = null;
    } else {
      const mask = canvasToMask(canvas);
      if (!mask) { this.sel = null; }
      else {
        const W = this.doc.width, H = this.doc.height;
        this.sel = { canvas, path: loopsToPath2D(traceLoops(mask, W, H)), bounds: maskBounds(mask, W, H) };
      }
    }
    if (this.sel) this.startAnts();
    if (record) this.push(label);
    this.renderOptions();
    this.drawOverlay();
    announce(this.sel ? `${label}: ${this.sel.bounds.w} by ${this.sel.bounds.h} pixels selected` : 'Selection cleared');
  }
  wandAt(p, mode) {
    const id = ctx2d(this.doc).getImageData(0, 0, this.doc.width, this.doc.height);
    const m = floodMask(id, p.x, p.y, this.o.tol, this.o.contiguous);
    this.combine(maskToCanvas(m, this.doc.width, this.doc.height), mode, 'Magic wand');
  }
  selAction(a) {
    const W = this.doc.width, H = this.doc.height;
    if (a === 'all') { const c = makeCanvas(W, H); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); this.setSelection(c, 'Select all'); }
    if (a === 'none') this.setSelection(null, 'Deselect');
    if (a === 'invert' && this.sel) { const c = makeCanvas(W, H); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-out'; x.drawImage(this.sel.canvas, 0, 0); this.setSelection(c, 'Invert selection'); }
    if (a === 'delete' && this.sel) {
      const x = this.doc.getContext('2d'); x.save(); x.globalCompositeOperation = 'destination-out'; x.drawImage(this.sel.canvas, 0, 0); x.restore();
      this.push('Delete pixels'); this.render(); announce('Selected pixels deleted');
    }
    if (a === 'fill' && this.sel) {
      const t = makeCanvas(W, H), tx = t.getContext('2d');
      tx.fillStyle = this.o.color; tx.fillRect(0, 0, W, H); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(this.sel.canvas, 0, 0);
      this.doc.getContext('2d').drawImage(t, 0, 0); this.push('Fill selection'); this.render();
    }
    if (a === 'crop' && this.sel) { const b = this.sel.bounds; this.cropTo(b.x, b.y, b.w, b.h, 'Crop to selection'); }
  }

  // ───────────────────────── Painting ─────────────────────────
  startPaint(p) {
    const W = this.doc.width, H = this.doc.height;
    this.g = { kind: 'paint', base: cloneCanvas(this.doc), stroke: makeCanvas(W, H), last: p, erase: this.o.tool === 'eraser' };
    this.dab(p);
    this.composite();
  }
  dab(p) {
    const g = this.g, x = g.stroke.getContext('2d');
    const size = g.erase ? this.o.eSize : this.o.size;
    const hard = g.erase ? this.o.eHardness : this.o.hardness;
    const r = size / 2;
    const col = g.erase ? '#000000' : this.o.color;
    const grd = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grd.addColorStop(0, col); grd.addColorStop(Math.min(0.99, Math.max(0.01, hard)), col); grd.addColorStop(1, hexA(col, 0));
    x.fillStyle = grd; x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
  }
  paintTo(p) {
    const g = this.g;
    const size = g.erase ? this.o.eSize : this.o.size;
    const step = Math.max(0.6, size * 0.12);
    const d = Math.hypot(p.x - g.last.x, p.y - g.last.y);
    const n = Math.floor(d / step);
    for (let i = 1; i <= n; i++) this.dab({ x: g.last.x + ((p.x - g.last.x) * i) / n, y: g.last.y + ((p.y - g.last.y) * i) / n });
    if (n) g.last = p;
    this.composite();
  }
  composite() {
    const g = this.g;
    const x = this.doc.getContext('2d');
    x.save();
    x.globalCompositeOperation = 'copy'; x.drawImage(g.base, 0, 0);
    let s = g.stroke;
    if (this.sel) { s = cloneCanvas(g.stroke); const sx = s.getContext('2d'); sx.globalCompositeOperation = 'destination-in'; sx.drawImage(this.sel.canvas, 0, 0); }
    x.globalAlpha = this.o.opacity;
    x.globalCompositeOperation = g.erase ? 'destination-out' : 'source-over';
    if (g.erase) x.globalAlpha = 1;
    x.drawImage(s, 0, 0);
    x.restore();
    this.render();
  }
  endPaint(cancel = false) {
    const g = this.g; this.g = null;
    if (cancel) { const x = this.doc.getContext('2d'); x.save(); x.globalCompositeOperation = 'copy'; x.drawImage(g.base, 0, 0); x.restore(); this.render(); return; }
    this.push(g.erase ? 'Eraser' : 'Brush stroke');
  }
  fillAt(p) {
    const W = this.doc.width, H = this.doc.height;
    if (p.x < 0 || p.y < 0 || p.x >= W || p.y >= H) return;
    const id = ctx2d(this.doc).getImageData(0, 0, W, H);
    const m = maskToCanvas(floodMask(id, p.x, p.y, this.o.fillTol, this.o.fillContig), W, H);
    if (this.sel) { const mx = m.getContext('2d'); mx.globalCompositeOperation = 'destination-in'; mx.drawImage(this.sel.canvas, 0, 0); }
    const t = makeCanvas(W, H), tx = t.getContext('2d');
    tx.fillStyle = this.o.color; tx.fillRect(0, 0, W, H); tx.globalCompositeOperation = 'destination-in'; tx.drawImage(m, 0, 0);
    this.doc.getContext('2d').drawImage(t, 0, 0);
    this.push('Paint bucket'); this.render();
  }
  pickAt(p) {
    const W = this.doc.width, H = this.doc.height;
    if (p.x < 0 || p.y < 0 || p.x >= W || p.y >= H) return;
    const d = ctx2d(this.doc).getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
    if (d[3] < 10) { toast('That pixel is transparent'); return; }
    const c = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    this.setColor(c); this.renderOptions();
    announce(`Picked colour ${c}`);
  }

  // ───────────────────────── Crop ─────────────────────────
  startCrop() {
    const b = this.sel?.bounds;
    this.crop = b ? { ...b } : { x: 0, y: 0, w: this.doc.width, h: this.doc.height };
    this.constrainCrop();
  }
  aspect() {
    const a = this.o.aspect;
    if (a === 'free') return null;
    if (a === 'orig') return this.doc.width / this.doc.height;
    return +a;
  }
  constrainCrop() {
    const a = this.aspect(); const c = this.crop; if (!c) return;
    if (a) {
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      let w = c.w, hh = w / a; if (hh > c.h) { hh = c.h; w = hh * a; }
      c.w = w; c.h = hh; c.x = cx - w / 2; c.y = cy - hh / 2;
    }
    this.clampCrop();
  }
  clampCrop() {
    const c = this.crop, W = this.doc.width, H = this.doc.height;
    c.w = Math.min(c.w, W); c.h = Math.min(c.h, H);
    c.x = clamp(c.x, 0, W - c.w); c.y = clamp(c.y, 0, H - c.h);
  }
  cropHit(p) {
    const c = this.crop, hs = 14 / this.z;
    const names = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const hp = cropHandles(c);
    for (let i = 0; i < hp.length; i++) if (Math.abs(p.x - hp[i][0]) < hs && Math.abs(p.y - hp[i][1]) < hs) return names[i];
    if (p.x > c.x && p.x < c.x + c.w && p.y > c.y && p.y < c.y + c.h) return 'move';
    return 'new';
  }
  cropHover(p) {
    if (!this.crop) return;
    const h = this.cropHit(p);
    this.vp.dataset.cursor = h === 'move' ? 'move' : h === 'new' ? 'crosshair' : ['n', 's'].includes(h) ? 'ns' : ['e', 'w'].includes(h) ? 'ew' : ['nw', 'se'].includes(h) ? 'nwse' : 'nesw';
  }
  cropDown(p) {
    const hit = this.cropHit(p);
    this.g = { kind: 'crop', hit, p0: p, c0: { ...this.crop } };
  }
  cropDrag(p) {
    const g = this.g, c0 = g.c0, dx = p.x - g.p0.x, dy = p.y - g.p0.y;
    const W = this.doc.width, H = this.doc.height;
    let { x, y, w, h: hh } = c0;
    const a = this.aspect();
    if (g.hit === 'move') { x += dx; y += dy; this.crop = { x, y, w, h: hh }; this.clampCrop(); this.drawOverlay(); return; }
    if (g.hit === 'new') {
      const q0 = { x: clamp(g.p0.x, 0, W), y: clamp(g.p0.y, 0, H) }; let q1 = { x: clamp(p.x, 0, W), y: clamp(p.y, 0, H) };
      if (a) { const sw = Math.abs(q1.x - q0.x), sh = sw / a; q1 = { x: q1.x, y: q0.y + Math.sign(q1.y - q0.y || 1) * sh }; }
      const r = normRect(q0, q1); this.crop = { x: r.x, y: r.y, w: Math.max(1, r.w), h: Math.max(1, r.h) }; this.clampCrop(); this.drawOverlay(); return;
    }
    let x1 = x + w, y1 = y + hh;
    if (g.hit.includes('w')) x = clamp(c0.x + dx, 0, x1 - 4);
    if (g.hit.includes('e')) x1 = clamp(c0.x + c0.w + dx, x + 4, W);
    if (g.hit.includes('n')) y = clamp(c0.y + dy, 0, y1 - 4);
    if (g.hit.includes('s')) y1 = clamp(c0.y + c0.h + dy, y + 4, H);
    w = x1 - x; hh = y1 - y;
    if (a) {
      if (g.hit === 'n' || g.hit === 's') w = hh * a; else hh = w / a;
      if (g.hit.includes('n')) y = y1 - hh;
      if (g.hit.includes('w')) x = x1 - w;
    }
    this.crop = { x, y, w, h: hh }; this.clampCrop(); this.drawOverlay();
  }
  applyCrop() {
    if (!this.crop) return;
    const c = this.crop; this.crop = null;
    this.cropTo(Math.round(c.x), Math.round(c.y), Math.round(c.w), Math.round(c.h), 'Crop');
    if (this.o.tool === 'crop') this.setTool('rect', false);
  }
  cancelCrop() { this.crop = null; this.drawOverlay(); }
  cropTo(x, y, w, hh, label) {
    if (w < 1 || hh < 1) return;
    const out = makeCanvas(w, hh);
    out.getContext('2d').drawImage(this.doc, -x, -y);
    this.doc = out; this.sel = null; this.crop = null;
    this.push(label); this.fit(); this.renderOptions();
    announce(`${label}: ${w} by ${hh} pixels`);
  }

  // ───────────────────────── Transforms ─────────────────────────
  transform(kind) {
    const s = this.doc, W = s.width, H = s.height;
    let out;
    if (kind === 'rotL' || kind === 'rotR') {
      out = makeCanvas(H, W); const x = out.getContext('2d');
      x.translate(H / 2, W / 2); x.rotate(kind === 'rotR' ? Math.PI / 2 : -Math.PI / 2); x.drawImage(s, -W / 2, -H / 2);
    } else if (kind === 'flipH' || kind === 'flipV') {
      out = makeCanvas(W, H); const x = out.getContext('2d');
      if (kind === 'flipH') { x.translate(W, 0); x.scale(-1, 1); } else { x.translate(0, H); x.scale(1, -1); }
      x.drawImage(s, 0, 0);
    } else if (kind === 'trim') {
      out = trimTransparent(s);
      if (out === s) { toast('Nothing to trim'); return; }
    }
    this.doc = out; this.sel = null;
    const labels = { rotL: 'Rotate left', rotR: 'Rotate right', flipH: 'Flip horizontal', flipV: 'Flip vertical', trim: 'Trim transparent edges' };
    this.push(labels[kind]); this.fit(); this.renderOptions();
    announce(labels[kind]);
  }
  rotatedCanvas(deg) {
    const s = this.doc, a = (deg * Math.PI) / 180;
    const W = s.width, H = s.height;
    const nw = Math.ceil(Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a))), nh = Math.ceil(Math.abs(W * Math.sin(a)) + Math.abs(H * Math.cos(a)));
    const out = makeCanvas(nw, nh), x = out.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.translate(nw / 2, nh / 2); x.rotate(a); x.drawImage(s, -W / 2, -H / 2);
    return out;
  }

  // ───────────────────────── Previews (filters / rotate / vector) ─────────────────────────
  setPreview(canvas, label) {
    const dimsChanged = !this.preview ? (canvas.width !== this.doc.width || canvas.height !== this.doc.height) : (canvas.width !== this.preview.width || canvas.height !== this.preview.height);
    this.preview = canvas; this.previewLabel = label;
    if (dimsChanged) { const keep = { z: this.z }; this.fitTo(canvas, keep); }
    this.render();
    this.updateSidePreviewState();
  }
  fitTo(c) {
    const r = this.vp.getBoundingClientRect();
    const pad = r.width < 500 ? 16 : 40;
    this.z = Math.min((r.width - pad * 2) / c.width, (r.height - pad * 2) / c.height, 4);
    this.tx = (r.width - c.width * this.z) / 2; this.ty = (r.height - c.height * this.z) / 2;
  }
  clearPreview() {
    if (!this.preview) return;
    const dims = this.preview.width !== this.doc.width || this.preview.height !== this.doc.height;
    this.preview = null; this.filter.id = null; this.rotAngle = 0;
    if (dims) this.fit(); else this.render();
    this.renderSide();
  }
  commitPreview() {
    if (!this.preview) return;
    const label = this.previewLabel;
    const dims = this.preview.width !== this.doc.width || this.preview.height !== this.doc.height;
    this.doc = this.preview; this.preview = null; this.filter.id = null; this.rotAngle = 0;
    if (dims) this.sel = null;
    this.push(label);
    if (dims) this.fit(); else this.render();
    this.renderSide(); this.renderOptions();
    announce(`${label} applied`);
  }
  filteredCanvas(id, amount) {
    const W = this.doc.width, H = this.doc.height;
    const src = ctx2d(this.doc).getImageData(0, 0, W, H);
    const res = applyPreset(src, id, amount / 100);
    const c = makeCanvas(W, H);
    c.getContext('2d').putImageData(res, 0, 0);
    if (!this.sel) return c;
    // limit to selection
    const out = cloneCanvas(this.doc), x = out.getContext('2d');
    const part = cloneCanvas(c), px = part.getContext('2d');
    px.globalCompositeOperation = 'destination-in'; px.drawImage(this.sel.canvas, 0, 0);
    x.globalCompositeOperation = 'destination-out'; x.drawImage(this.sel.canvas, 0, 0);
    x.globalCompositeOperation = 'source-over'; x.drawImage(part, 0, 0);
    return out;
  }

  // ───────────────────────── Side panels ─────────────────────────
  setSideTab(id) {
    if (this.sideTab !== id && this.preview) this.clearPreview();
    this.sideTab = id;
    $$('[data-stab]', this.dlg).forEach((b) => { const on = b.dataset.stab === id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    $$('[data-spanel]', this.dlg).forEach((p) => { p.hidden = p.dataset.spanel !== id; });
    this.renderSide();
  }
  renderSide() {
    const id = this.sideTab;
    const p = $(`[data-spanel="${id}"]`, this.dlg);
    if (id === 'filters') this.renderFilters(p);
    if (id === 'transform') this.renderTransform(p);
    if (id === 'vector') this.renderVector(p);
    if (id === 'history') this.renderHistory(p);
  }
  updateSidePreviewState() {
    $$('[data-preview-actions]', this.dlg).forEach((el) => { el.hidden = !this.preview; });
  }
  previewActions() {
    return `<div class="preview-actions" data-preview-actions ${this.preview ? '' : 'hidden'}>
      <button type="button" class="btn btn-sm btn-primary" data-commit>${icon('check', 16)} Apply</button>
      <button type="button" class="btn btn-sm btn-ghost" data-discard>Cancel</button></div>`;
  }
  wirePreviewActions(p) {
    $('[data-commit]', p)?.addEventListener('click', () => this.commitPreview());
    $('[data-discard]', p)?.addEventListener('click', () => this.clearPreview());
  }
  renderFilters(p) {
    p.innerHTML = `
      <p class="muted small">${this.sel ? 'Filters apply to the current selection.' : 'Filters apply to the whole image. Make a selection to limit them.'}</p>
      <div class="filter-grid" role="radiogroup" aria-label="Filter presets">
        ${PRESETS.map((f) => `<button type="button" class="filter-btn" role="radio" aria-checked="${this.filter.id === f.id}" data-f="${f.id}"><span class="filter-thumb" data-ft="${f.id}"></span><span>${f.label}</span></button>`).join('')}
      </div>
      <label class="range-row"><label for="f-amt">Intensity</label><output>${this.filter.amount}%</output><input id="f-amt" type="range" min="0" max="100" value="${this.filter.amount}" data-famt></label>
      ${this.previewActions()}`;
    const items = $$('[data-f]', p);
    items.forEach((b) => b.addEventListener('click', () => {
      this.filter.id = b.dataset.f;
      items.forEach((x) => x.setAttribute('aria-checked', x === b));
      this.runFilterPreview();
    }));
    $('.filter-grid', p).addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement); if (i < 0) return;
      let j = i;
      if (e.key === 'ArrowRight') j = i + 1; if (e.key === 'ArrowLeft') j = i - 1; if (e.key === 'ArrowDown') j = i + 3; if (e.key === 'ArrowUp') j = i - 3;
      if (j !== i) { e.preventDefault(); items[clamp(j, 0, items.length - 1)].focus(); }
    });
    const amt = $('[data-famt]', p);
    const runDeb = debounce(() => this.runFilterPreview(), 60);
    amt.addEventListener('input', () => { this.filter.amount = +amt.value; amt.parentElement.querySelector('output').textContent = amt.value + '%'; if (this.filter.id) runDeb(); });
    this.wirePreviewActions(p);
    this.filterThumbs(p);
  }
  runFilterPreview() {
    if (!this.filter.id) return;
    const f = PRESETS.find((x) => x.id === this.filter.id);
    this.setPreview(this.filteredCanvas(f.id, this.filter.amount), `${f.label} filter`);
  }
  filterThumbs(p) {
    const s = this.doc, k = 64 / Math.max(s.width, s.height);
    const c = makeCanvas(Math.max(1, s.width * k), Math.max(1, s.height * k));
    const x = ctx2d(c); x.drawImage(s, 0, 0, c.width, c.height);
    const src = x.getImageData(0, 0, c.width, c.height);
    for (const f of PRESETS) {
      const out = makeCanvas(c.width, c.height);
      out.getContext('2d').putImageData(applyPreset(src, f.id, 1), 0, 0);
      const el = $(`[data-ft="${f.id}"]`, p);
      if (el) el.style.backgroundImage = `url(${out.toDataURL()})`;
    }
  }
  renderTransform(p) {
    p.innerHTML = `
      <div class="prop-group">
        <h3 class="field-label">Rotate & flip</h3>
        <div class="btn-grid">
          <button type="button" class="btn btn-sm" data-tf="rotL">${icon('rotL', 16)} Rotate left</button>
          <button type="button" class="btn btn-sm" data-tf="rotR">${icon('rotR', 16)} Rotate right</button>
          <button type="button" class="btn btn-sm" data-tf="flipH">${icon('flipH', 16)} Flip horizontal</button>
          <button type="button" class="btn btn-sm" data-tf="flipV">${icon('flipV', 16)} Flip vertical</button>
        </div>
      </div>
      <div class="prop-group">
        <h3 class="field-label">Free rotate</h3>
        <div class="range-row"><label for="rot-a">Angle</label><output>${this.rotAngle}°</output><input id="rot-a" type="range" min="-180" max="180" step="1" value="${this.rotAngle}" data-rot></div>
        ${this.previewActions()}
      </div>
      <div class="prop-group">
        <h3 class="field-label">Canvas</h3>
        <div class="btn-grid">
          <button type="button" class="btn btn-sm" data-tf="trim">Trim transparent edges</button>
          <button type="button" class="btn btn-sm" data-tool-crop>${icon('crop', 16)} Crop tool</button>
          ${this.original && this.original !== this.doc ? `<button type="button" class="btn btn-sm" data-reset>Revert to original</button>` : ''}
        </div>
        <p class="muted small">${this.doc.width} × ${this.doc.height} px</p>
      </div>`;
    $$('[data-tf]', p).forEach((b) => b.addEventListener('click', () => { if (this.preview) this.clearPreview(); this.transform(b.dataset.tf); this.renderSide(); }));
    const rot = $('[data-rot]', p);
    const run = debounce(() => { if (this.rotAngle === 0) { this.clearPreview(); return; } this.setPreview(this.rotatedCanvas(this.rotAngle), `Rotate ${this.rotAngle}°`); }, 40);
    rot.addEventListener('input', () => { this.rotAngle = +rot.value; rot.parentElement.querySelector('output').textContent = rot.value + '°'; run(); });
    this.wirePreviewActions(p);
    $('[data-tool-crop]', p).addEventListener('click', () => this.setTool('crop'));
    $('[data-reset]', p)?.addEventListener('click', async () => {
      const img = await loadImage(this.original);
      this.doc = imageToCanvas(img, MAX_DOC); this.sel = null;
      this.push('Revert to original'); this.fit(); this.renderSide(); this.renderOptions();
    });
  }
  renderVector(p) {
    const v = this.vec;
    p.innerHTML = `
      <p class="muted small">Trace the image into clean vector shapes with a limited colour palette — ideal before stitching or printing.</p>
      <div class="range-row"><label for="v-c">Colours</label><output>${v.colors}</output><input id="v-c" type="range" min="2" max="16" value="${v.colors}" data-v="colors"></div>
      <div class="range-row"><label for="v-d">Detail</label><output>${Math.round(v.detail * 100)}%</output><input id="v-d" type="range" min="0" max="100" value="${Math.round(v.detail * 100)}" data-v="detail"></div>
      <div class="range-row"><label for="v-s">Remove specks</label><output>${v.speckle}px</output><input id="v-s" type="range" min="0" max="80" value="${v.speckle}" data-v="speckle"></div>
      <label class="check"><input type="checkbox" data-v="smooth" ${v.smooth ? 'checked' : ''}> Smooth curves</label>
      <label class="check"><input type="checkbox" data-v="removeBg" ${v.removeBg ? 'checked' : ''}> Remove background colour</label>
      <div class="btn-row"><button type="button" class="btn btn-sm btn-primary" data-vrun>${icon('vector', 16)} Preview vector</button></div>
      <p class="muted small" data-vstat aria-live="polite">${v.last && this.preview ? `${v.last.layers.length} colours · ${v.last.pathCount} shapes` : ''}</p>
      ${this.previewActions()}
      <button type="button" class="btn btn-sm" data-vsvg ${v.last ? '' : 'disabled'}>${icon('download', 16)} Download SVG</button>`;
    const run = debounce(() => this.runVector(p), 220);
    $$('[data-v]', p).forEach((inp) => inp.addEventListener(inp.type === 'checkbox' ? 'change' : 'input', () => {
      const k = inp.dataset.v;
      v[k] = inp.type === 'checkbox' ? inp.checked : k === 'detail' ? +inp.value / 100 : +inp.value;
      const out = inp.parentElement.querySelector('output'); if (out) out.textContent = k === 'detail' ? inp.value + '%' : k === 'speckle' ? inp.value + 'px' : inp.value;
      if (this.preview) run();
    }));
    $('[data-vrun]', p).addEventListener('click', () => this.runVector(p));
    $('[data-vsvg]', p).addEventListener('click', () => {
      if (!v.last) return;
      downloadBlob(new Blob([v.last.svg], { type: 'image/svg+xml' }), (this.name || 'artwork').replace(/[^\w-]+/g, '-').toLowerCase() + '.svg');
    });
    this.wirePreviewActions(p);
  }
  runVector(p) {
    const stat = $('[data-vstat]', p);
    if (stat) stat.textContent = 'Tracing…';
    setTimeout(() => {
      const t0 = performance.now();
      const v = this.vec;
      const res = vectorize(this.doc, v);
      v.last = res;
      const c = rasterizeVector(res, this.doc.width, this.doc.height);
      this.setPreview(c, 'Vectorize');
      if (stat) stat.textContent = `${res.layers.length} colours · ${res.pathCount} shapes · ${Math.round(performance.now() - t0)} ms`;
      const dl = $('[data-vsvg]', p); if (dl) dl.disabled = false;
    }, 20);
  }
  renderHistory(p) {
    p.innerHTML = `<ol class="hist-list" aria-label="History">${this.hist.map((hh, i) => `<li><button type="button" class="hist-item ${i === this.hi ? 'current' : ''} ${i > this.hi ? 'future' : ''}" data-h="${i}" ${i === this.hi ? 'aria-current="step"' : ''}>${esc(hh.label)}</button></li>`).join('')}</ol>`;
    $$('[data-h]', p).forEach((b) => b.addEventListener('click', () => { this.goto(+b.dataset.h); }));
    $('.hist-item.current', p)?.scrollIntoView({ block: 'nearest' });
  }

  // ───────────────────────── History ─────────────────────────
  push(label) {
    this.hist = this.hist.slice(0, this.hi + 1);
    this.hist.push({ label, doc: cloneCanvas(this.doc), sel: this.sel ? { ...this.sel, canvas: cloneCanvas(this.sel.canvas) } : null });
    if (this.hist.length > MAX_HIST) this.hist.splice(1, 1);
    this.hi = this.hist.length - 1;
    this.updateHist();
  }
  goto(i) {
    if (i < 0 || i >= this.hist.length) return;
    if (this.preview) { this.preview = null; this.filter.id = null; }
    this.crop = null;
    const e = this.hist[i];
    const dims = e.doc.width !== this.doc.width || e.doc.height !== this.doc.height;
    this.doc = cloneCanvas(e.doc);
    this.sel = e.sel ? { ...e.sel, canvas: cloneCanvas(e.sel.canvas) } : null;
    if (this.sel) this.startAnts();
    this.hi = i;
    if (dims) this.fit(); else this.render();
    this.updateHist(); this.renderOptions();
    if (this.sideTab !== 'history') this.renderSide();
  }
  undo() { if (this.hi > 0) { const l = this.hist[this.hi].label; this.goto(this.hi - 1); announce('Undid ' + l); } }
  redo() { if (this.hi < this.hist.length - 1) { this.goto(this.hi + 1); announce('Redid ' + this.hist[this.hi].label); } }
  updateHist() {
    $('[data-undo]', this.dlg).disabled = this.hi <= 0;
    $('[data-redo]', this.dlg).disabled = this.hi >= this.hist.length - 1;
    if (this.sideTab === 'history') this.renderHistory($('[data-spanel="history"]', this.dlg));
  }

  // ───────────────────────── Keyboard ─────────────────────────
  key(e) {
    const t = e.target;
    const typing = t.matches?.('input[type=text], input[type=search], input[type=url], input:not([type]), textarea, select');
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); return; }
    if (typing) return;
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); this.selAction('all'); return; }
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); this.selAction('none'); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'i') { e.preventDefault(); this.selAction('invert'); return; }
    if (mod) return;
    if (e.key === ' ' && !t.matches('button')) { e.preventDefault(); if (!this.space) { this.space = true; this.updateCursor(); } return; }
    if (e.key === 'Enter' && this.crop && !t.matches('button')) { e.preventDefault(); this.applyCrop(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel) { e.preventDefault(); this.selAction('delete'); return; }
    if (e.key === '+' || e.key === '=') { this.zoomAt(1.25); this.render(); return; }
    if (e.key === '-') { this.zoomAt(0.8); this.render(); return; }
    if (e.key === '0') { this.fit(); return; }
    if (e.key === '[' || e.key === ']') {
      const k = this.o.tool === 'eraser' ? 'eSize' : 'size';
      this.o[k] = clamp(Math.round(this.o[k] * (e.key === ']' ? 1.2 : 1 / 1.2)), 1, 300);
      this.renderOptions(); this.drawOverlay(); return;
    }
    if (t.matches('input[type=range]')) return;
    const tool = TOOLS.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
    if (tool && !e.altKey) { e.preventDefault(); this.setTool(tool.id); }
    if (e.key === '?') this.showShortcuts();
  }
  showShortcuts() {
    toast('Tools: H M U L W C B E G I · Ctrl+Z undo · Ctrl+A/D select all/none · [ ] brush size · Space pan · 0 fit', { timeout: 7000 });
  }
}

function normRect(a, b) { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }; }
function cropHandles(c) {
  const { x, y, w, h: hh } = c;
  return [[x, y], [x + w / 2, y], [x + w, y], [x + w, y + hh / 2], [x + w, y + hh], [x + w / 2, y + hh], [x, y + hh], [x, y + hh / 2]];
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
