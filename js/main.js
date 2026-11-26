import { $ } from './lib/dom.js';
import { prefs } from './lib/store.js';
import { loadGarmentArt } from './garments/custom.js';

const artReady = loadGarmentArt();

const routes = [
  { re: /^#?\/?$/, load: () => import('./views/home.js') },
  { re: /^#\/new(?:\/(.*))?$/, load: () => import('./views/wizard.js') },
  { re: /^#\/design\/([\w-]+)$/, load: () => import('./views/designer.js') },
];

let cleanup = null;
let navToken = 0;

async function route() {
  const hash = location.hash || '#/';
  const token = ++navToken;
  const r = routes.find((x) => x.re.test(hash)) || routes[0];
  const m = hash.match(r.re) || [];
  const [mod] = await Promise.all([r.load(), artReady]);
  if (token !== navToken) return;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  const app = $('#app');
  app.innerHTML = '';
  app.className = '';
  cleanup = (await mod.mount(app, m.slice(1))) || null;
  const main = $('#main', app);
  if (main && !app.dataset.noFocus) {
    // move focus to the new page's heading for screen readers / keyboard users
    const h1 = main.querySelector('h1');
    (h1 || main).setAttribute('tabindex', '-1');
    (h1 || main).focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
}

export function navigate(hash) {
  if (location.hash === hash) route(); else location.hash = hash;
}

// Theme: follow system unless user picked one
const theme = prefs.get('theme', null);
if (theme) document.documentElement.dataset.theme = theme;
export function toggleTheme() {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  prefs.set('theme', next);
  return next;
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
