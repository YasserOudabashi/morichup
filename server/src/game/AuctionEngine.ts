import type { Player, PlayerSessionId } from "@morichup/shared";

/**
 * Ordine di turno per un'asta a giro singolo: tutti i giocatori attivi,
 * a partire da quello successivo a `startAfterId` (di norma chi ha appena
 * rifiutato l'acquisto), fino a tornare a lui incluso.
 */
export function computeAuctionTurnOrder(players: Player[], startAfterId: PlayerSessionId | null): PlayerSessionId[] {
  const eligible = players.filter((p) => p.status === "active").map((p) => p.sessionId);
  if (eligible.length < 2) return [];
  const startIndex = startAfterId ? eligible.indexOf(startAfterId) : -1;
  if (startIndex === -1) return eligible;
  return [...eligible.slice(startIndex + 1), ...eligible.slice(0, startIndex + 1)];
}
