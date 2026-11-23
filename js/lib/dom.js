export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function debounce(fn, ms) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  d.cancel = () => clearTimeout(t);
  return d;
}

export function announce(msg) {
  const live = document.getElementById('live');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = msg; });
}

export function toast(msg, { action, onAction, timeout = 3200, tone = '' } = {}) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = h(`<div class="toast ${tone}" role="status"><span>${esc(msg)}</span>${action ? `<button type="button" class="btn btn-ghost btn-sm">${esc(action)}</button>` : ''}</div>`);
  host.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  if (action) el.querySelector('button').addEventListener('click', () => { onAction?.(); close(); });
  setTimeout(close, timeout);
}

/** Open a native <dialog> modal. Returns { el, close }. */
export function openDialog({ title, body, className = '', onClose, labelledBy, wide = false, actions = '' }) {
  const id = 'dlg-' + uid();
  const el = h(`<dialog class="dialog ${wide ? 'dialog-wide' : ''} ${className}" aria-labelledby="${id}-t">
      <header class="dialog-head"><h2 id="${id}-t" class="dialog-title">${esc(title)}</h2>
        <button type="button" class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>
      <div class="dialog-body"></div>
      ${actions ? `<footer class="dialog-foot">${actions}</footer>` : ''}
    </dialog>`);
  const bodyEl = el.querySelector('.dialog-body');
  if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
  document.body.appendChild(el);
  const prevFocus = document.activeElement;
  let closed = false;
  const close = (result) => {
    if (closed) return; closed = true;
    try { el.close(); } catch { /* */ }
    el.remove();
    onClose?.(result);
    if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
  };
  el.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
    else if (e.target === el) { // backdrop click
      const r = el.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
    }
  });
  el.showModal();
  return { el, body: bodyEl, close };
}

export function confirmDialog(message, { okLabel = 'Confirm', danger = false, title = 'Are you sure?' } = {}) {
  return new Promise((resolve) => {
    const d = openDialog({
      title, body: `<p>${esc(message)}</p>`,
      actions: `<button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okLabel)}</button>`,
      onClose: (r) => resolve(!!r),
    });
    d.el.querySelector('[data-ok]').addEventListener('click', () => d.close(true));
    d.el.querySelector('[data-ok]').focus();
  });
}

/** Arrow-key roving focus within a grid/list of focusables. */
export function rovingGrid(container, selector) {
  container.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    const items = $$(selector, container).filter((x) => x.offsetParent !== null);
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const cols = (() => {
      const top0 = items[0].getBoundingClientRect().top;
      let n = 0; for (const it of items) { if (Math.abs(it.getBoundingClientRect().top - top0) < 4) n++; else break; }
      return Math.max(1, n);
    })();
    let j = i;
    if (e.key === 'ArrowRight') j = i + 1;
    if (e.key === 'ArrowLeft') j = i - 1;
    if (e.key === 'ArrowDown') j = i + cols;
    if (e.key === 'ArrowUp') j = i - cols;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = items.length - 1;
    j = clamp(j, 0, items.length - 1);
    if (j !== i) { e.preventDefault(); items[j].focus(); }
  });
}

// ── Icons (inline, 24px stroke icons) ───────────────────────────────
const I = {
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 005.4-1.6"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 017.5-2"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  shirt: '<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3c-1 2-2.5 3-4 3S9 5 8 3z"/>',
  zoomIn: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M8 11h6"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  move: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 013 0V11M11 10V4.5a1.5 1.5 0 013 0V11M14 10V5.5a1.5 1.5 0 013 0V13M17 9.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1.5a6 6 0 01-4.6-2.2L4.6 14a1.5 1.5 0 012.2-2L8 13"/>',
  rectSel: '<rect x="4" y="5" width="16" height="14" rx="1" stroke-dasharray="3 2.5"/>',
  ellipseSel: '<ellipse cx="12" cy="12" rx="8.5" ry="7" stroke-dasharray="3 2.5"/>',
  lasso: '<path d="M7 17c-3-1-4-3.5-4-6 0-4 4-7 9-7s9 3 9 7-4 7-9 7c-1.5 0-3-.3-4-.7" stroke-dasharray="3 2.5"/><path d="M7 17c0 2 1 3 2.5 4"/>',
  wand: '<path d="M4 20l11-11M15 9l2-2"/><path d="M17 3v2M21 7h-2M19.5 4.5l-1.4 1.4M12 4l.5 1.5M20 12l-1.5-.5"/>',
  crop: '<path d="M6 2v16h16"/><path d="M2 6h16v16"/>',
  brush: '<path d="M14 4l6 6-8 8-6-6z"/><path d="M6 12c-2 0-3 1.5-3 3.5S2 19 2 20c3 0 6-.5 7-2.5"/>',
  eraser: '<path d="M8 20h12M5 15l9-9 5 5-9 9H8z"/><path d="M10 10l5 5"/>',
  bucket: '<path d="M4 11l7-7 8 8-7 7z"/><path d="M4 11h15"/><path d="M20 15s2 2.5 2 3.5a2 2 0 01-4 0c0-1 2-3.5 2-3.5z"/>',
  dropper: '<path d="M14 4l6 6M17 7l-9.5 9.5L5 19l-1 1M7.5 16.5L5 14l9.5-9.5"/>',
  rotL: '<path d="M4 4v6h6"/><path d="M4.5 10A8 8 0 1112 20"/>',
  rotR: '<path d="M20 4v6h-6"/><path d="M19.5 10A8 8 0 1012 20"/>',
  flipH: '<path d="M12 3v18M8 7L3 12l5 5zM16 7l5 5-5 5z"/>',
  flipV: '<path d="M3 12h18M7 8l5-5 5 5zM7 16l5 5 5-5z"/>',
  vector: '<path d="M5 19C9 5 15 19 19 5"/><rect x="2.5" y="16.5" width="5" height="5" rx="1"/><rect x="16.5" y="2.5" width="5" height="5" rx="1"/>',
  filter: '<circle cx="9" cy="9" r="5.5"/><circle cx="15" cy="9" r="5.5"/><circle cx="12" cy="14.5" r="5.5"/>',
  history: '<path d="M3 12a9 9 0 103-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  maximize: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  minimize: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  home: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.6 0-1-.8-1.4-.8-2.4 0-1 .8-1.6 1.8-1.6H17a4 4 0 004-4c0-4.6-4-8.4-9-8.4z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/>',
  center: '<path d="M12 3v18M7 8h10v8H7z"/>',
  invert: '<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="3 2.5"/><path d="M4 20L20 4"/>',
  selectAll: '<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="3 2.5"/><path d="M9 12l2 2 4-4"/>',
  deselect: '<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="3 2.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
};
export function icon(name, size = 20, label) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'} focusable="false">${I[name] || ''}</svg>`;
}
