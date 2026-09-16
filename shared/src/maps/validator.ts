import type { BoardConfig, TileType } from "../index";
import { cornerIndices, perimeterCount, CORNER_TYPES_IN_ORDER } from "./geometry";

const MIN_SIZE = 8;
const MAX_SIZE = 15;
const PURCHASABLE_TYPES: TileType[] = ["property", "railroad", "utility"];
const TAX_TYPES: TileType[] = ["incomeTax", "luxuryTax"];
const CORNER_TYPES: TileType[] = ["start", "jail", "freeParking", "goToJail"];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Fase 9, FR-901: unica fonte di verità per "una mappa è giocabile", usata
 * sia dall'editor client (prima di esportare/inviare) sia dal server (prima
 * di accettare una mappa personalizzata) — il server non si fida mai del
 * client, quindi rivalida sempre anche se l'editor ha già validato.
 */
export function validateBoard(board: BoardConfig): ValidationResult {
  const errors: string[] = [];
  const { width, height, tiles } = board;

  if (!Number.isInteger(width) || width < MIN_SIZE || width > MAX_SIZE) {
    errors.push(`La larghezza deve essere un intero tra ${MIN_SIZE} e ${MAX_SIZE} (trovato ${width})`);
  }
  if (!Number.isInteger(height) || height < MIN_SIZE || height > MAX_SIZE) {
    errors.push(`L'altezza deve essere un intero tra ${MIN_SIZE} e ${MAX_SIZE} (trovato ${height})`);
  }
  if (errors.length > 0) return { valid: false, errors };

  const expectedCount = perimeterCount(width, height);
  if (tiles.length !== expectedCount) {
    errors.push(`Il numero di caselle (${tiles.length}) non corrisponde al perimetro di ${width}x${height} (atteso ${expectedCount})`);
  }

  const seenPositions = new Set<string>();
  const seenIds = new Set<string>();
  for (const tile of tiles) {
    const posKey = `${tile.position.x},${tile.position.y}`;
    if (seenPositions.has(posKey)) errors.push(`Posizione duplicata: (${tile.position.x}, ${tile.position.y})`);
    seenPositions.add(posKey);

    if (seenIds.has(tile.id)) errors.push(`Id casella duplicato: "${tile.id}"`);
    seenIds.add(tile.id);

    if (!tile.name || !tile.name.trim()) errors.push(`Casella "${tile.id}" senza nome`);
  }

  const corners = cornerIndices(width, height);
  corners.forEach((idx, i) => {
    const expectedType = CORNER_TYPES_IN_ORDER[i];
    const tile = tiles[idx];
    if (!tile) {
      errors.push(`Manca la casella d'angolo "${expectedType}" all'indice ${idx}`);
      return;
    }
    if (tile.type !== expectedType) {
      errors.push(`La casella all'indice ${idx} dovrebbe essere "${expectedType}", trovato "${tile.type}"`);
    }
  });
  tiles.forEach((tile, idx) => {
    if (CORNER_TYPES.includes(tile.type) && !corners.includes(idx)) {
      errors.push(`"${tile.name}" (indice ${idx}) è di tipo "${tile.type}" ma non è in una posizione d'angolo`);
    }
  });

  for (const tile of tiles) {
    if (PURCHASABLE_TYPES.includes(tile.type) && !(tile.purchasePrice != null && tile.purchasePrice > 0)) {
      errors.push(`"${tile.name}" (${tile.type}) deve avere un prezzo d'acquisto positivo`);
    }
    if (tile.type === "property") {
      if (!tile.group || !tile.group.trim()) errors.push(`"${tile.name}" deve appartenere a un gruppo`);
      if (!(tile.baseRent != null && tile.baseRent >= 0)) errors.push(`"${tile.name}" deve avere un affitto base non negativo`);
    }
    if (TAX_TYPES.includes(tile.type) && !(tile.amount != null && tile.amount > 0)) {
      errors.push(`"${tile.name}" (${tile.type}) deve avere un importo positivo`);
    }
  }

  return { valid: errors.length === 0, errors };
}
