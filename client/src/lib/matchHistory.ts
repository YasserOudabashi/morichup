import type { GameState, ServerEvent, WinReason } from "@morichup/shared";

const HISTORY_KEY = "morichup.matchHistory";
/** Tetto al numero di partite salvate: ogni voce porta con sé uno stato di
 * gioco completo per passo (per il replay), può pesare parecchio in
 * localStorage, quindi si tiene solo la cronologia più recente. */
const MAX_ENTRIES = 10;

export interface MatchHistoryEntry {
  id: string;
  date: number;
  mapId: string;
  mapName: string;
  playerCount: number;
  result: "won" | "lost" | "spectated";
  winReason?: WinReason;
  durationMs: number;
  /** Tutti gli eventi della partita, dal più vecchio al più recente. */
  events: ServerEvent[];
  /** Uno stato di gioco completo per ogni passo ricevuto dal server: la base del replay. */
  steps: GameState[];
  /** Per ogni passo, quanti eventi di `events` erano già accaduti: sincronizza l'EventLog nel replay. */
  stepEventCounts: number[];
}

export function getMatchHistory(): MatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MatchHistoryEntry[];
  } catch {
    return [];
  }
}

/** Scarta le partite più vecchie finché il salvataggio non entra nel limite
 * di quota del browser, invece di far fallire (o peggio, bloccare) la partita
 * appena conclusa: coerente con lo storage "best effort" già usato altrove
 * (vedi session.ts). */
export function saveMatchHistoryEntry(entry: MatchHistoryEntry): void {
  const existing = getMatchHistory();
  let next = [entry, ...existing].slice(0, MAX_ENTRIES);
  while (next.length > 0) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return;
    } catch {
      next = next.slice(0, -1);
    }
  }
}

export function clearMatchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // localStorage non disponibile: niente da cancellare.
  }
}
