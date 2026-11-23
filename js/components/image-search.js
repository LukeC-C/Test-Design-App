// Keyless, CORS-enabled image search providers.
const TIMEOUT_MS = 15000;

export class SearchError extends Error {
  constructor(msg) { super(msg); this.name = 'SearchError'; }
}

/** fetch JSON with a hard timeout that also respects the caller's abort signal. */
async function fetchJSON(url, { signal, label, headers }) {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  let timedOut = false;
  const t = setTimeout(() => { timedOut = true; ctrl.abort(); }, TIMEOUT_MS);
  try {
    let res;
    for (let attempt = 0; ; attempt++) {
      res = await fetch(url, { signal: ctrl.signal, headers });
      // brief automatic retry when rate-limited
      if (res.status !== 429 || attempt >= 2) break;
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
    if (res.status === 429 || res.status === 503 || res.status === 504) throw new SearchError(`${label} is busy right now.`);
    if (!res.ok) throw new SearchError(`${label} returned an error (HTTP ${res.status}).`);
    return await res.json();
  } catch (e) {
    if (e instanceof SearchError) throw e;
    if (timedOut) throw new SearchError(`${label} took too long to respond.`);
    if (e.name === 'AbortError') throw e; // cancelled by a newer search
    throw new SearchError(`Couldn’t reach ${label}.`);
  } finally {
    clearTimeout(t);
    signal?.removeEventListener('abort', onAbort);
  }
}

// Standard thumbnail widths Wikimedia serves (non-standard widths are rejected).
const WM_THUMB = 330;
const WM_SIZES = [330, 500, 960, 1280];
// Identify the app, as Wikimedia asks of browser clients (allowed by their CORS policy).
const WM_HEADERS = { 'Api-User-Agent': 'AtelierDesignApp/1.0 (https://github.com/LukeC-C/Test-Design-App)' };

const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export const PROVIDERS = {
  wikimedia: {
    label: 'Wikimedia Commons',
    note: 'Free media from the Wikimedia Commons library',
    async search(q, page = 1, { kind = 'any', signal } = {}) {
      const ft = kind === 'illustration' || kind === 'transparent' ? 'filetype:drawing' : kind === 'photo' ? 'filetype:bitmap' : 'filetype:bitmap|drawing';
      const u = new URL('https://commons.wikimedia.org/w/api.php');
      const p = {
        action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6',
        gsrsearch: `${q} ${ft}`, gsrlimit: '30', gsroffset: String((page - 1) * 30),
        prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: String(WM_THUMB),
        iiextmetadatafilter: 'Artist|LicenseShortName|ObjectName',
      };
      for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v);
      const data = await fetchJSON(u, { signal, label: 'Wikimedia Commons', headers: WM_HEADERS });
      const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
      const items = pages.map((pg) => {
        const ii = pg.imageinfo?.[0] || {};
        const md = ii.extmetadata || {};
        const thumb = ii.thumburl || ii.url;
        // Wikimedia only serves thumbnails at standard widths; anything else returns HTTP 400.
        let full = ii.url;
        const vector = /svg|tiff|pdf|djvu/.test(ii.mime || '');
        if (thumb && (vector || (ii.width || 0) > 1280)) {
          const w = vector ? 1280 : WM_SIZES.filter((x) => x < (ii.width || 0)).pop() || WM_THUMB;
          full = thumb.replace(/\/\d+px-/, `/${w}px-`);
        }
        return {
          id: 'wm-' + pg.pageid,
          title: stripTags(md.ObjectName?.value) || pg.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
          creator: stripTags(md.Artist?.value).slice(0, 80),
          license: stripTags(md.LicenseShortName?.value),
          thumb,
          sources: [full, thumb].filter(Boolean),
          page: ii.descriptionurl,
          source: 'Wikimedia Commons',
          w: ii.width, h: ii.height,
        };
      }).filter((x) => x.thumb);
      return { items, hasMore: !!data.continue };
    },
  },
  openverse: {
    label: 'Openverse',
    note: 'Openly-licensed images from Flickr, museums and more (often slow or busy)',
    async search(q, page = 1, { kind = 'any', signal } = {}) {
      const u = new URL('https://api.openverse.org/v1/images/');
      u.searchParams.set('q', q);
      u.searchParams.set('page', page);
      u.searchParams.set('page_size', '20');
      u.searchParams.set('mature', 'false');
      if (kind === 'illustration') u.searchParams.set('category', 'illustration,digitized_artwork');
      if (kind === 'photo') u.searchParams.set('category', 'photograph');
      if (kind === 'transparent') u.searchParams.set('extension', 'png,svg');
      const data = await fetchJSON(u, { signal, label: 'Openverse' });
      const items = (data.results || []).map((r) => ({
        id: 'ov-' + r.id,
        title: r.title || 'Untitled',
        creator: r.creator || '',
        license: r.license ? `CC ${String(r.license).toUpperCase()} ${r.license_version || ''}`.replace('CC CC0', 'CC0').replace('CC PDM', 'Public domain').trim() : '',
        thumb: r.thumbnail || r.url,
        sources: [r.url, r.thumbnail].filter(Boolean),
        page: r.foreign_landing_url || r.url,
        source: r.source ? `${r.source} via Openverse` : 'Openverse',
        w: r.width, h: r.height,
      }));
      return { items, hasMore: page < (data.page_count || 1) && items.length > 0 };
    },
  },
};

export const SUGGESTIONS = ['rose illustration', 'skull', 'butterfly', 'mountain line art', 'vintage logo', 'tiger', 'wave', 'flame', 'botanical', 'star', 'retro sun', 'koi fish'];
