// localStorage persistence: the live session (autosave/restore) and named
// saved versions, one per job application.

const SESSION_KEY = "rt:session:v1";
const VERSIONS_KEY = "rt:versions:v1";

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(snapshot) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // storage full or unavailable — autosave is best-effort
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function loadVersions() {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persistVersions(list) {
  try {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function saveVersion(name, snapshot) {
  const versions = loadVersions();
  const version = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Untitled",
    savedAt: new Date().toISOString(),
    snapshot,
  };
  const ok = persistVersions([version, ...versions]);
  return ok ? version : null;
}

export function deleteVersion(id) {
  const next = loadVersions().filter((v) => v.id !== id);
  persistVersions(next);
  return next;
}
