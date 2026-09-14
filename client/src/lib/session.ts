const SESSION_KEY = "morichup.sessionId";
const NICKNAME_KEY = "morichup.nickname";
const ROOM_CODE_KEY = "morichup.lastRoomCode";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Identificatore persistente del client (playerSessionId), sopravvive al reload. */
export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = randomId();
    localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return randomId(); // storage non disponibile: sessione valida solo per questo caricamento
  }
}

export function getSavedNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNickname(nickname: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, nickname);
  } catch {
    // localStorage non disponibile (es. modalità privata): nickname resta solo in memoria.
  }
}

/** Ultima stanza a cui si era collegati: usata per il rientro automatico dopo un reload. */
export function getLastRoomCode(): string | null {
  try {
    return localStorage.getItem(ROOM_CODE_KEY);
  } catch {
    return null;
  }
}

export function saveLastRoomCode(code: string | null): void {
  try {
    if (code) localStorage.setItem(ROOM_CODE_KEY, code);
    else localStorage.removeItem(ROOM_CODE_KEY);
  } catch {
    // localStorage non disponibile: nessun rientro automatico possibile, non blocca il gioco.
  }
}
