// Almacenamiento local + sincronización con un repositorio de GitHub (archivo JSON).
// Los datos se guardan siempre en el dispositivo y, si configuras GitHub, se fusionan con el archivo remoto.

const KEY = 'gymcoach.state.v1';
const GH_KEY = 'gymcoach.github.v1';
const ACTIVE_KEY = 'gymcoach.active.v1';

export function defaultState() {
  return {
    schema: 1,
    metaUpdatedAt: 0,
    onboarded: false,
    profile: { sex: 'hombre', age: '', height: '', weight: '' },
    settings: { days: 3, restMain: 150, restAcc: 90 },
    choices: {},
    unavailable: {},
    sessions: [],
    deleted: [],
    bodyweight: [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch { return defaultState(); }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function touchMeta(state) { state.metaUpdatedAt = Date.now(); }

export function loadActive() {
  try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch { return null; }
}
export function saveActive(a) {
  if (a) localStorage.setItem(ACTIVE_KEY, JSON.stringify(a)); else localStorage.removeItem(ACTIVE_KEY);
}

// ---------- fusión ----------
function unionById(a = [], b = [], del) {
  const map = new Map();
  for (const x of [...a, ...b]) {
    if (del.has(x.id)) continue;
    const prev = map.get(x.id);
    if (!prev || (x.updatedAt || 0) > (prev.updatedAt || 0)) map.set(x.id, x);
  }
  return [...map.values()];
}

export function mergeStates(local, remote) {
  if (!remote) return local;
  const del = new Set([...(local.deleted || []), ...(remote.deleted || [])]);
  const metaSrc = (remote.metaUpdatedAt || 0) > (local.metaUpdatedAt || 0) ? remote : local;
  return {
    ...defaultState(),
    schema: 1,
    metaUpdatedAt: metaSrc.metaUpdatedAt || 0,
    onboarded: local.onboarded || remote.onboarded,
    profile: metaSrc.profile,
    settings: metaSrc.settings,
    choices: metaSrc.choices,
    unavailable: metaSrc.unavailable,
    deleted: [...del],
    sessions: unionById(local.sessions, remote.sessions, del),
    bodyweight: unionById(local.bodyweight, remote.bodyweight, del),
  };
}

// ---------- GitHub ----------
export function loadGh() {
  try { return JSON.parse(localStorage.getItem(GH_KEY) || 'null') || { owner: '', repo: 'gym-datos', path: 'datos.json', branch: 'main', token: '' }; }
  catch { return { owner: '', repo: 'gym-datos', path: 'datos.json', branch: 'main', token: '' }; }
}
export function saveGh(cfg) { localStorage.setItem(GH_KEY, JSON.stringify(cfg)); }
export function ghConfigured(cfg = loadGh()) { return !!(cfg.owner && cfg.repo && cfg.token); }

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ghHeaders(cfg) {
  return {
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}
function ghUrl(cfg) {
  const path = cfg.path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}`;
}

async function ghGet(cfg) {
  const res = await fetch(`${ghUrl(cfg)}?ref=${encodeURIComponent(cfg.branch || 'main')}&t=${Date.now()}`, { headers: ghHeaders(cfg), cache: 'no-store' });
  if (res.status === 404) return { data: null, sha: null };
  if (res.status === 401) throw new Error('Token no válido o caducado (401).');
  if (res.status === 403) throw new Error('El token no tiene permiso sobre ese repositorio (403).');
  if (!res.ok) throw new Error(`GitHub respondió ${res.status}.`);
  const j = await res.json();
  return { data: JSON.parse(b64decode(j.content || '')), sha: j.sha };
}

async function ghPut(cfg, data, sha) {
  const body = {
    message: `Entrenamientos ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    content: b64encode(JSON.stringify(data, null, 1)),
    branch: cfg.branch || 'main',
  };
  if (sha) body.sha = sha;
  const res = await fetch(ghUrl(cfg), { method: 'PUT', headers: { ...ghHeaders(cfg), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 409 || res.status === 422) return { conflict: true };
  if (res.status === 404) throw new Error('No encuentro el repositorio. Revisa usuario y nombre del repo, y que el token tenga acceso a él.');
  if (!res.ok) throw new Error(`No se pudo guardar en GitHub (${res.status}).`);
  return { ok: true };
}

// Descarga, fusiona y sube. Devuelve el estado fusionado.
export async function syncWithGithub(local) {
  const cfg = loadGh();
  if (!ghConfigured(cfg)) throw new Error('GitHub no está configurado.');
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: remote, sha } = await ghGet(cfg);
    const merged = mergeStates(local, remote);
    const same = remote && JSON.stringify(remote) === JSON.stringify(merged);
    if (same) return merged;
    const r = await ghPut(cfg, merged, sha);
    if (r.ok) return merged;
    local = merged; // conflicto: otro dispositivo guardó a la vez, reintentamos
  }
  throw new Error('Conflicto al guardar en GitHub. Inténtalo de nuevo.');
}

export async function testGithub(cfg) {
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`, { headers: ghHeaders(cfg), cache: 'no-store' });
  if (res.status === 401) throw new Error('Token no válido (401).');
  if (res.status === 404) throw new Error('Repositorio no encontrado o el token no tiene acceso.');
  if (!res.ok) throw new Error(`GitHub respondió ${res.status}.`);
  const j = await res.json();
  if (!j.private) return 'Conectado. Ojo: el repositorio es PÚBLICO, cualquiera podría ver tus datos. Mejor hazlo privado.';
  return 'Conectado al repositorio privado correctamente.';
}
