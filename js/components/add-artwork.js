// "Add artwork" flow: 1) choose addition method, 2) choose an image (web search / upload / link).
import { openDialog, esc, icon, $, $$, announce, toast, rovingGrid } from '../lib/dom.js';
import { METHODS, methodIcon, renderMethod, demoArtwork } from './methods.js';
import { PROVIDERS, SUGGESTIONS } from './image-search.js';
import { urlToDataURL, fileToDataURL } from '../lib/image.js';
import { prefs } from '../lib/store.js';

export function openAddArtwork({ garmentColor = '#cccccc' } = {}) {
  return new Promise((resolve) => {
    let result = null;
    const state = {
      method: prefs.get('lastMethod', 'print'),
      provider: prefs.get('provider', 'openverse'),
      kind: 'any', q: '', page: 1, items: [], hasMore: false, selected: null, busy: false, ctrl: null,
      tab: 'search',
    };
    const d = openDialog({ title: 'Add artwork', wide: true, className: 'add-dialog', body: '<div class="add-flow"></div>', onClose: () => resolve(result) });
    const host = $('.add-flow', d.el);

    // ── Step 1: method ─────────────────────────────────────────
    function stepMethod() {
      host.innerHTML = `
        <div class="add-step">
          <p class="step-kicker">Step 1 of 2</p>
          <h3 class="add-h">How should the artwork be added?</h3>
          <p class="muted">You can change this later for each piece of artwork.</p>
          <div class="method-cards" role="radiogroup" aria-label="Addition method">
            ${METHODS.map((m) => `<button type="button" role="radio" class="method-big" data-m="${m.id}" aria-checked="${m.id === state.method}" tabindex="${m.id === state.method ? 0 : -1}">
              <span class="mb-preview" data-prev="${m.id}" style="--garment:${garmentColor}">${methodIcon(m.id, 44)}</span>
              <span class="mb-text"><span class="mb-title">${esc(m.label)}</span><span class="mb-desc">${esc(m.desc)}</span><span class="mb-best">Best for: ${esc(m.best)}</span></span>
            </button>`).join('')}
          </div>
          <div class="add-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-primary" data-next>Choose image ${icon('next', 18)}</button></div>
        </div>`;
      const cards = $$('.method-big', host);
      const choose = (b, focus) => {
        state.method = b.dataset.m;
        cards.forEach((c) => { const on = c === b; c.setAttribute('aria-checked', on); c.tabIndex = on ? 0 : -1; });
        if (focus) b.focus();
      };
      cards.forEach((b) => {
        b.addEventListener('click', () => choose(b));
        b.addEventListener('dblclick', () => { choose(b); stepSource(); });
      });
      $('.method-cards', host).addEventListener('keydown', (e) => {
        const i = cards.indexOf(document.activeElement); if (i < 0) return;
        if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); choose(cards[(i + 1) % cards.length], true); }
        if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); choose(cards[(i - 1 + cards.length) % cards.length], true); }
        if (e.key === 'Enter') { e.preventDefault(); stepSource(); }
      });
      $('[data-next]', host).addEventListener('click', stepSource);
      (cards.find((c) => c.dataset.m === state.method) || cards[0]).focus();
      // live previews of each method on demo artwork
      const demo = demoArtwork(200);
      for (const m of METHODS) {
        renderMethod(demo, m.id, { w: 48, h: 48, ...m.defaults }).then((url) => {
          const el = $(`[data-prev="${m.id}"]`, host);
          if (el) el.innerHTML = `<img src="${url}" alt="" class="mb-img mb-${m.id}">`;
        }).catch(() => {});
      }
    }

    // ── Step 2: source ─────────────────────────────────────────
    function stepSource() {
      prefs.set('lastMethod', state.method);
      const m = METHODS.find((x) => x.id === state.method);
      host.innerHTML = `
        <div class="add-step add-src">
          <div class="src-head">
            <div><p class="step-kicker">Step 2 of 2</p><h3 class="add-h">Choose an image</h3></div>
            <button type="button" class="method-chip" data-back aria-label="Addition method: ${esc(m.label)}. Change">${methodIcon(m.id, 26)}<span>${esc(m.label)}</span><span class="chip-change">Change</span></button>
          </div>
          <div class="seg src-tabs" role="tablist" aria-label="Image source">
            <button type="button" role="tab" id="t-search" aria-controls="p-search" aria-selected="${state.tab === 'search'}" data-tab="search">${icon('search', 16)} Search web</button>
            <button type="button" role="tab" id="t-upload" aria-controls="p-upload" aria-selected="${state.tab === 'upload'}" data-tab="upload">${icon('upload', 16)} Upload</button>
            <button type="button" role="tab" id="t-link" aria-controls="p-link" aria-selected="${state.tab === 'link'}" data-tab="link">${icon('link', 16)} Link</button>
          </div>
          <section role="tabpanel" id="p-search" aria-labelledby="t-search" class="src-panel" ${state.tab === 'search' ? '' : 'hidden'}>
            <form class="search-form" data-search role="search">
              <label class="search-field grow">${icon('search', 18)}<span class="sr-only">Search images</span><input type="search" name="q" value="${esc(state.q)}" placeholder="Search images, e.g. “rose line art”" autocomplete="off" enterkeyhint="search"></label>
              <label class="sr-only" for="prov">Source</label>
              <select id="prov" class="select" name="provider">${Object.entries(PROVIDERS).map(([k, p]) => `<option value="${k}" ${k === state.provider ? 'selected' : ''}>${p.label}</option>`).join('')}</select>
              <label class="sr-only" for="kind">Image type</label>
              <select id="kind" class="select" name="kind">
                <option value="any">All images</option><option value="illustration" ${state.kind === 'illustration' ? 'selected' : ''}>Illustrations</option>
                <option value="photo" ${state.kind === 'photo' ? 'selected' : ''}>Photos</option><option value="transparent" ${state.kind === 'transparent' ? 'selected' : ''}>Graphics (PNG/SVG)</option>
              </select>
              <button type="submit" class="btn btn-primary">Search</button>
            </form>
            <div class="search-split">
              <div class="results-wrap">
                <p class="results-status muted" aria-live="polite" data-status></p>
                <ul class="results" data-results aria-label="Search results"></ul>
                <div class="more-row"><button type="button" class="btn btn-sm" data-more hidden>Load more</button></div>
              </div>
              <aside class="result-detail" data-detail aria-label="Selected image" hidden></aside>
            </div>
          </section>
          <section role="tabpanel" id="p-upload" aria-labelledby="t-upload" class="src-panel" ${state.tab === 'upload' ? '' : 'hidden'}>
            <label class="dropzone" data-drop>
              <input type="file" accept="image/*" class="sr-only" data-file>
              ${icon('image', 40)}
              <span class="dz-main">Drop an image here, or <u>browse files</u></span>
              <span class="muted">PNG, JPG, WebP, GIF or SVG. You can also paste an image (Ctrl+V).</span>
            </label>
          </section>
          <section role="tabpanel" id="p-link" aria-labelledby="t-link" class="src-panel" ${state.tab === 'link' ? '' : 'hidden'}>
            <form class="link-form" data-link>
              <label class="field"><span>Image URL</span><input class="input" type="url" name="url" placeholder="https://…/image.png" required inputmode="url"></label>
              <p class="muted small">The host must allow cross-origin access (most image CDNs and Wikimedia do). If it doesn't, download the image and use Upload instead.</p>
              <button type="submit" class="btn btn-primary">Fetch image</button>
            </form>
          </section>
          <div class="busy-veil" data-busy hidden><div class="spinner" aria-hidden="true"></div><span>Preparing image…</span></div>
        </div>`;

      $('[data-back]', host).addEventListener('click', stepMethod);
      const tabs = $$('.src-tabs [role=tab]', host);
      const setTab = (t) => {
        state.tab = t;
        tabs.forEach((b) => { const on = b.dataset.tab === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
        $$('.src-panel', host).forEach((p) => { p.hidden = p.id !== 'p-' + t; });
      };
      tabs.forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
      $('.src-tabs', host).addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const i = tabs.indexOf(document.activeElement);
        const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[j].focus(); setTab(tabs[j].dataset.tab);
      });
      setTab(state.tab);

      // search
      const form = $('[data-search]', host);
      form.addEventListener('submit', (e) => { e.preventDefault(); runSearch(true); });
      form.provider.addEventListener('change', () => { state.provider = form.provider.value; prefs.set('provider', state.provider); if (state.q) runSearch(true); });
      form.kind.addEventListener('change', () => { state.kind = form.kind.value; if (state.q) runSearch(true); });
      $('[data-more]', host).addEventListener('click', () => runSearch(false));
      const resultsEl = $('[data-results]', host);
      rovingGrid(resultsEl, '.result');
      resultsEl.addEventListener('click', (e) => { const b = e.target.closest('.result'); if (b) selectItem(b.dataset.id); });
      resultsEl.addEventListener('dblclick', (e) => { const b = e.target.closest('.result'); if (b) { selectItem(b.dataset.id); importItem(false); } });
      renderResults();
      if (state.tab === 'search') form.q.focus();

      // upload
      const drop = $('[data-drop]', host);
      $('[data-file]', host).addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) importFile(f); });
      drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith('image/')); if (f) importFile(f); else toast('That file is not an image', { tone: 'error' }); });

      // link
      $('[data-link]', host).addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = e.target.url.value.trim();
        if (!url) return;
        await importFromUrls([url], { name: url.split('/').pop().split('?')[0].replace(/\.[a-z0-9]+$/i, '') || 'Linked image', credit: { title: 'Linked image', url, source: new URL(url).hostname } });
      });
    }

    async function runSearch(fresh) {
      const form = $('[data-search]', host);
      const q = form.q.value.trim();
      if (!q) { form.q.focus(); return; }
      if (fresh) { state.q = q; state.page = 1; state.items = []; state.selected = null; }
      else state.page++;
      state.ctrl?.abort();
      state.ctrl = new AbortController();
      const status = $('[data-status]', host);
      status.textContent = fresh ? 'Searching…' : 'Loading more…';
      $('[data-more]', host).hidden = true;
      if (fresh) { $('[data-results]', host).innerHTML = skeletons(); $('[data-detail]', host).hidden = true; }
      try {
        const prov = PROVIDERS[state.provider];
        const { items, hasMore } = await prov.search(state.q, state.page, { kind: state.kind, signal: state.ctrl.signal });
        const seen = new Set(state.items.map((x) => x.id));
        state.items.push(...items.filter((x) => !seen.has(x.id)));
        state.hasMore = hasMore;
        renderResults(fresh);
        status.textContent = state.items.length ? `${state.items.length} result${state.items.length === 1 ? '' : 's'} from ${prov.label}` : `No results for “${state.q}”. Try another word or source.`;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(err);
        if (fresh) $('[data-results]', host).innerHTML = '';
        status.innerHTML = `${esc(err.message === 'Failed to fetch' ? 'Couldn’t reach the image service. Check your connection, or try the other source.' : err.message)}`;
      }
    }

    function skeletons() { return Array.from({ length: 12 }, () => '<li><div class="result skeleton"></div></li>').join(''); }

    function renderResults(focusFirstNew = false) {
      const ul = $('[data-results]', host);
      if (!ul) return;
      if (!state.items.length && !state.q) {
        ul.innerHTML = '';
        $('[data-status]', host).innerHTML = '';
        ul.insertAdjacentHTML('beforebegin', '');
        ul.innerHTML = `<li class="suggest-li"><p class="muted">Try a search:</p><div class="chips">${SUGGESTIONS.map((s) => `<button type="button" class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('')}</div></li>`;
        $$('[data-suggest]', ul).forEach((b) => b.addEventListener('click', () => { $('[data-search]', host).q.value = b.dataset.suggest; runSearch(true); }));
        return;
      }
      ul.innerHTML = state.items.map((it) => `<li><button type="button" class="result" data-id="${esc(it.id)}" aria-pressed="${state.selected?.id === it.id}" aria-label="${esc(it.title)}${it.creator ? ' by ' + esc(it.creator) : ''}">
          <img src="${esc(it.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.closest('li').hidden=true">
        </button></li>`).join('');
      $('[data-more]', host).hidden = !state.hasMore;
      if (focusFirstNew && state.items.length) { /* keep focus in search field for quick refine */ }
    }

    function selectItem(id) {
      const it = state.items.find((x) => x.id === id);
      if (!it) return;
      state.selected = it;
      $$('.result', host).forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === id));
      const det = $('[data-detail]', host);
      det.hidden = false;
      det.innerHTML = `
        <div class="detail-img"><img src="${esc(it.thumb)}" alt="${esc(it.title)}" referrerpolicy="no-referrer"></div>
        <div class="detail-meta">
          <p class="detail-title">${esc(it.title)}</p>
          <p class="muted small">${it.creator ? 'by ' + esc(it.creator) + ' · ' : ''}${esc(it.license || 'See source for license')}</p>
          <p class="muted small">${esc(it.source)}${it.page ? ` · <a href="${esc(it.page)}" target="_blank" rel="noopener noreferrer">source</a>` : ''}</p>
        </div>
        <div class="detail-actions">
          <button type="button" class="btn btn-primary" data-add>${icon('plus', 18)} Add to design</button>
          <button type="button" class="btn" data-addedit>${icon('edit', 18)} Add &amp; edit</button>
        </div>`;
      $('[data-add]', det).addEventListener('click', () => importItem(false));
      $('[data-addedit]', det).addEventListener('click', () => importItem(true));
      announce(`${it.title} selected. Add to design button available.`);
    }

    async function importItem(edit) {
      const it = state.selected; if (!it) return;
      await importFromUrls(it.sources, { name: it.title.slice(0, 48), credit: { title: it.title, creator: it.creator, license: it.license, url: it.page, source: it.source }, edit });
    }

    async function importFromUrls(urls, meta) {
      setBusy(true);
      let lastErr;
      for (const u of urls) {
        try {
          const src = await urlToDataURL(u);
          return finish({ src, ...meta });
        } catch (e) { lastErr = e; }
      }
      setBusy(false);
      toast('This image’s host doesn’t allow it to be used here. Try another image, or download it and upload.', { tone: 'error', timeout: 6000 });
      console.warn(lastErr);
    }

    async function importFile(file) {
      if (!file.type.startsWith('image/')) { toast('That file is not an image', { tone: 'error' }); return; }
      setBusy(true);
      try {
        const src = await fileToDataURL(file);
        finish({ src, name: file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 48) || 'Upload', credit: null });
      } catch (e) {
        console.error(e); setBusy(false);
        toast('Could not read that image', { tone: 'error' });
      }
    }

    function setBusy(on) {
      const v = $('[data-busy]', host); if (v) v.hidden = !on;
      state.busy = on;
    }
    function finish(r) {
      result = { ...r, method: state.method, edit: !!r.edit };
      d.close(result);
    }

    // paste support
    d.el.addEventListener('paste', (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
      if (f) { e.preventDefault(); importFile(f); }
    });

    stepMethod();
  });
}
