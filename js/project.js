import { resolveSpec, productName } from './data/catalog.js';
import { uid } from './lib/dom.js';

export function defaultAccent(spec) {
  if (spec.tpl === 'shoe') {
    const k = spec.params.kind;
    if (k === 'sneaker') return spec.params.gum ? '#c48a4a' : '#f2f0eb';
    if (['slide', 'flipflop', 'sandal', 'espadrille', 'clog'].includes(k)) return k === 'clog' ? '#b98a5e' : '#e9dcc4';
    if (spec.params.rain) return '#2a2a2a';
    return '#241f1c';
  }
  if (spec.tpl === 'hat') return '#2b2b2b';
  return '#c0392b';
}

export function newProject(sel) {
  const spec = resolveSpec(sel);
  return {
    id: uid(),
    name: productName(sel),
    sel: { ...sel },
    color: spec.material?.color || '#cccccc',
    accent: defaultAccent(spec),
    views: { front: [], back: [] },
    created: Date.now(),
    updated: Date.now(),
    thumb: null,
  };
}

export function projectSpec(project) {
  return resolveSpec(project.sel);
}
