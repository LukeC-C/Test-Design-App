// Keyless, CORS-enabled image search providers.
const stripTags = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export const PROVIDERS = {
  openverse: {
    label: 'Openverse',
    note: 'Openly-licensed images from Flickr, museums and more',
    async search(q, page = 1, { kind = 'any', signal } = {}) {
      const u = new URL('https://api.openverse.org/v1/images/');
      u.searchParams.set('q', q);
      u.searchParams.set('page', page);
      u.searchParams.set('page_size', '20');
      u.searchParams.set('mature', 'false');
      if (kind === 'illustration') u.searchParams.set('category', 'illustration,digitized_artwork');
      if (kind === 'photo') u.searchParams.set('category', 'photograph');
      if (kind === 'transparent') u.searchParams.set('extension', 'png,svg');
      const res = await fetch(u, { signal, headers: { Accept: 'application/json' } });
      if (res.status === 429) throw new Error('Openverse is rate-limiting searches. Wait a moment and try again, or switch to Wikimedia Commons.');
      if (!res.ok) throw new Error(`Search failed (HTTP ${res.status})`);
      const data = await res.json();
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
  wikimedia: {
    label: 'Wikimedia Commons',
    note: 'Free media from the Wikimedia Commons library',
    async search(q, page = 1, { kind = 'any', signal } = {}) {
      const ft = kind === 'illustration' || kind === 'transparent' ? 'filetype:drawing' : kind === 'photo' ? 'filetype:bitmap' : 'filetype:bitmap|drawing';
      const u = new URL('https://commons.wikimedia.org/w/api.php');
      const p = {
        action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6',
        gsrsearch: `${q} ${ft}`, gsrlimit: '20', gsroffset: String((page - 1) * 20),
        prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '360',
        iiextmetadatafilter: 'Artist|LicenseShortName|ObjectName',
      };
      for (const [k, v] of Object.entries(p)) u.searchParams.set(k, v);
      const res = await fetch(u, { signal });
      if (!res.ok) throw new Error(`Search failed (HTTP ${res.status})`);
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
      const items = pages.map((pg) => {
        const ii = pg.imageinfo?.[0] || {};
        const md = ii.extmetadata || {};
        const thumb = ii.thumburl || ii.url;
        let full = ii.url;
        if (ii.width > 1400 || /svg|tiff|pdf/.test(ii.mime || '')) full = thumb?.replace(/\/\d+px-/, '/1400px-');
        if (/svg/.test(ii.mime || '') && ii.width && ii.width < 1400) full = thumb?.replace(/\/\d+px-/, `/${Math.max(800, ii.width)}px-`);
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
};

export const SUGGESTIONS = ['rose illustration', 'skull', 'butterfly', 'mountain line art', 'vintage logo', 'tiger', 'wave', 'flame', 'botanical', 'star', 'retro sun', 'koi fish'];
