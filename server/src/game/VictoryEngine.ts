import type { Player, PlayerSessionId } from "@morichup/shared";

/** Ritorna l'id del vincitore se resta un solo giocatore non bancarottato, altrimenti null.
 * Gli spettatori (Fase 8, US-802) non sono concorrenti: esclusi dal conteggio. */
export function checkVictory(players: Player[]): PlayerSessionId | null {
  const remaining = players.filter((p) => p.status !== "bankrupt" && p.status !== "spectator");
  if (remaining.length === 1) return remaining[0].sessionId;
  return null;
}
