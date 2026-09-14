import type { BoardConfig, Tile } from "@morichup/shared";

export function getTileAt(board: BoardConfig, index: number): Tile {
  const tile = board.tiles[index];
  if (!tile) throw new Error(`Nessuna casella all'indice ${index}`);
  return tile;
}

export function findTileIndex(board: BoardConfig, tileId: string): number {
  const index = board.tiles.findIndex((t) => t.id === tileId);
  if (index === -1) throw new Error(`Casella sconosciuta: ${tileId}`);
  return index;
}

export interface MoveResult {
  from: number;
  to: number;
  passedGo: boolean;
}

/** Avanza di `steps` caselle dalla posizione `from`, gestendo il giro del percorso. */
export function movePosition(board: BoardConfig, from: number, steps: number): MoveResult {
  const total = board.tiles.length;
  const to = (from + steps) % total;
  const passedGo = from + steps >= total;
  return { from, to, passedGo };
}
