import type { BoardConfig, Player, PlayerSessionId } from "@morichup/shared";

/** Ritorna l'id del vincitore se resta un solo giocatore non bancarottato, altrimenti null. */
export function checkVictory(players: Player[]): PlayerSessionId | null {
  const remaining = players.filter((p) => p.status !== "bankrupt");
  if (remaining.length === 1) return remaining[0].sessionId;
  return null;
}

/**
 * Patrimonio netto di un giocatore: liquidità + valore nominale (mai il valore
 * dimezzato usato per la vendita alla banca) di proprietà, case e hotel posseduti.
 * Usato solo per decidere il vincitore a limite di turni/tempo (Fase 7, US-704).
 */
export function computeNetWorth(board: BoardConfig, player: Player): number {
  let worth = player.money;
  for (const tileId of player.properties) {
    const tile = board.tiles.find((t) => t.id === tileId);
    if (!tile) continue;
    worth += tile.purchasePrice ?? 0;
    if (tile.hotel) {
      worth += tile.hotelCost ?? 0;
    } else if (tile.houses) {
      worth += tile.houses * (tile.houseCost ?? 0);
    }
  }
  return worth;
}

/**
 * Vincitore per limite di turni/tempo raggiunto: il patrimonio netto più alto tra i
 * giocatori ancora attivi (chi è già bancarotta ha già perso, non entra nel confronto).
 */
export function checkNetWorthVictory(board: BoardConfig, players: Player[]): PlayerSessionId | null {
  const active = players.filter((p) => p.status !== "bankrupt");
  if (active.length === 0) return null;

  let best = active[0];
  let bestWorth = computeNetWorth(board, best);
  for (const p of active.slice(1)) {
    const worth = computeNetWorth(board, p);
    if (worth > bestWorth) {
      best = p;
      bestWorth = worth;
    }
  }
  return best.sessionId;
}
