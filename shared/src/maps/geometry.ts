import type { TileType } from "../index";

/**
 * Cammino del perimetro in senso orario a partire da "start" in alto a
 * sinistra (stesso schema delle 4 mappe ufficiali, vedi classic.ts): unica
 * fonte di verità sia per l'editor (Fase 9) sia per il validatore, così le
 * mappe generate dall'editor e quelle ufficiali restano sempre coerenti.
 */
export function coordFor(index: number, width: number, height: number): { x: number; y: number } {
  if (index < width) return { x: index, y: 0 };
  if (index < width + height - 1) return { x: width - 1, y: index - width + 1 };
  if (index < 2 * width + height - 2) return { x: 2 * width + height - 3 - index, y: height - 1 };
  return { x: 0, y: 2 * width + 2 * height - 4 - index };
}

/** Numero di caselle del perimetro per una board width×height. */
export function perimeterCount(width: number, height: number): number {
  return 2 * width + 2 * height - 4;
}

/** Indici (nell'ordine del perimetro) dei 4 angoli geometrici, sempre in
 * quest'ordine: start, jail, freeParking, goToJail. */
export function cornerIndices(width: number, height: number): [number, number, number, number] {
  return [0, width - 1, width + height - 2, 2 * width + height - 3];
}

export const CORNER_TYPES_IN_ORDER: TileType[] = ["start", "jail", "freeParking", "goToJail"];

/** Tipo atteso all'indice dato, se è un angolo; altrimenti null. */
export function cornerTypeAt(index: number, width: number, height: number): TileType | null {
  const corners = cornerIndices(width, height);
  const pos = corners.indexOf(index);
  return pos === -1 ? null : CORNER_TYPES_IN_ORDER[pos];
}
