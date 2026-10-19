// Where the player's progress lives. The game only talks to this module, so the
// cloud sync (cloud.js) can plug in here without touching game code.
const KEY = 'mikinha-progresso-v2';
const listeners = new Set();

export function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

export function saveLocal(data) {
  data.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode or storage full */ }
  listeners.forEach(fn => fn(data));
}

/** Called after every local save (used by the cloud sync). */
export function onSave(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Replaces the progress in the running game, e.g. with a newer copy from the cloud. */
export function replaceProgress(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('mikinha:replace', { detail:data }));
}

/** Backup code: the whole progress as one text block the parent can store anywhere. */
export function toBackupCode(data) {
  return 'MIKINHA1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

export function fromBackupCode(code) {
  const raw = code.trim().replace(/^MIKINHA1:/, '');
  const data = JSON.parse(decodeURIComponent(escape(atob(raw))));
  if (!data || data.v !== 2) throw new Error('Código de backup inválido.');
  return data;
}
