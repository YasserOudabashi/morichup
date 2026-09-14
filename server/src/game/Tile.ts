import type { BoardConfig, PlayerSessionId, Tile } from "@morichup/shared";

export function isPropertyLike(tile: Tile): boolean {
  return tile.type === "property" || tile.type === "railroad" || tile.type === "utility";
}

/** True se `ownerId` possiede tutte le proprietà del gruppo colore di `tile`. */
export function ownsFullGroup(board: BoardConfig, ownerId: PlayerSessionId, group: string): boolean {
  const groupTiles = board.tiles.filter((t) => t.type === "property" && t.group === group);
  return groupTiles.length > 0 && groupTiles.every((t) => t.ownerId === ownerId);
}

function countOwned(board: BoardConfig, ownerId: PlayerSessionId, type: Tile["type"]): number {
  return board.tiles.filter((t) => t.type === type && t.ownerId === ownerId).length;
}

/** Calcola il rent dovuto per una casella posseduta da un altro giocatore. */
export function computeRent(board: BoardConfig, tile: Tile, diceSum: number): number {
  if (tile.ownerId == null) return 0;

  if (tile.type === "property") {
    const base = tile.baseRent ?? 0;
    const hasMonopoly = tile.group ? ownsFullGroup(board, tile.ownerId, tile.group) : false;
    // Nessun sistema di case/hotel in Fase 2: il monopolio (senza case) raddoppia il rent base.
    return hasMonopoly && (tile.houses ?? 0) === 0 ? base * 2 : base;
  }

  if (tile.type === "railroad") {
    const owned = countOwned(board, tile.ownerId, "railroad");
    const base = tile.baseRent ?? 25;
    return base * 2 ** (owned - 1);
  }

  if (tile.type === "utility") {
    const owned = countOwned(board, tile.ownerId, "utility");
    return diceSum * (owned >= 2 ? 10 : 4);
  }

  return 0;
}
