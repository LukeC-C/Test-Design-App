// Tiny IndexedDB-backed project store with in-memory fallback.
const DB = 'atelier';
const STORE = 'projects';
let dbp = null;
const mem = new Map();

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbp;
}

async function tx(mode, fn) {
  const db = await open();
  if (!db) return fn(null);
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    const res = fn(s);
    t.oncomplete = () => resolve(res?.result ?? res);
    t.onerror = () => reject(t.error);
  });
}

export async function listProjects() {
  const db = await open();
  if (!db) return [...mem.values()].sort((a, b) => b.updated - a.updated);
  return new Promise((resolve) => {
    const out = [];
    const req = db.transaction(STORE).objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) {
        const { id, name, sel, color, accent, updated, thumb } = c.value;
        out.push({ id, name, sel, color, accent, updated, thumb });
        c.continue();
      } else resolve(out.sort((a, b) => b.updated - a.updated));
    };
    req.onerror = () => resolve(out);
  });
}

export async function getProject(id) {
  const db = await open();
  if (!db) return mem.get(id) ? structuredClone(mem.get(id)) : null;
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function saveProject(p) {
  p.updated = Date.now();
  const db = await open();
  if (!db) { mem.set(p.id, structuredClone(p)); return p; }
  await tx('readwrite', (s) => s.put(p));
  return p;
}

export async function deleteProject(id) {
  const db = await open();
  if (!db) { mem.delete(id); return; }
  await tx('readwrite', (s) => s.delete(id));
}

// Small per-viewer preferences
export const prefs = {
  get(k, d) { try { const v = localStorage.getItem('atelier:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('atelier:' + k, JSON.stringify(v)); } catch { /* */ } },
};
