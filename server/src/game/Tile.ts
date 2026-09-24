import type { BoardConfig, PlayerSessionId, Tile } from "@morichup/shared";
import { HOTEL_RENT_MULTIPLIER, MAX_HOUSES } from "./GameRules";

export function isPropertyLike(tile: Tile): boolean {
  return tile.type === "property" || tile.type === "railroad" || tile.type === "utility";
}

/** True se `ownerId` possiede tutte le proprietà del gruppo colore di `tile`. */
export function ownsFullGroup(board: BoardConfig, ownerId: PlayerSessionId, group: string): boolean {
  const groupTiles = board.tiles.filter((t) => t.type === "property" && t.group === group);
  return groupTiles.length > 0 && groupTiles.every((t) => t.ownerId === ownerId);
}

/** Tutte le proprietà dello stesso gruppo colore di `tile` (incluso `tile` stesso). */
export function groupTilesOf(board: BoardConfig, tile: Tile): Tile[] {
  return board.tiles.filter((t) => t.type === "property" && t.group === tile.group);
}

/**
 * Livello di edificazione di una proprietà, da 0 (niente) a MAX_HOUSES
 * (4 case) fino a MAX_HOUSES + 1 (hotel). Un unico numero comparabile rende
 * banale la regola "even building" (mai più di 1 livello di scarto tra le
 * proprietà dello stesso gruppo).
 */
export function buildingLevel(tile: Tile): number {
  if (tile.hotel) return MAX_HOUSES + 1;
  return tile.houses ?? 0;
}

function countOwned(board: BoardConfig, ownerId: PlayerSessionId, type: Tile["type"]): number {
  return board.tiles.filter((t) => t.type === type && t.ownerId === ownerId).length;
}

/** Calcola il rent dovuto per una casella posseduta da un altro giocatore. */
export function computeRent(board: BoardConfig, tile: Tile, diceSum: number): number {
  if (tile.ownerId == null) return 0;

  if (tile.type === "property") {
    const base = tile.baseRent ?? 0;
    const level = buildingLevel(tile);
    if (level > 0 && level <= MAX_HOUSES && tile.rentLevels) {
      return tile.rentLevels[level - 1] ?? base;
    }
    if (level === MAX_HOUSES + 1) {
      const fourHouseRent = tile.rentLevels?.[MAX_HOUSES - 1] ?? base;
      return Math.round(fourHouseRent * HOTEL_RENT_MULTIPLIER);
    }
    const hasMonopoly = tile.group ? ownsFullGroup(board, tile.ownerId, tile.group) : false;
    // Regola opzionale (Fase 13): di serie true, disattivabile dall'host in lobby.
    const doubleRent = board.rules.doubleRentFullSet !== false;
    return hasMonopoly && doubleRent ? base * 2 : base;
  }

  if (tile.type === "railroad") {
    // 25 * 2^(x-1), x = quanti aeroporti possiede: 1->25, 2->50, 3->100, 4->200.
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
