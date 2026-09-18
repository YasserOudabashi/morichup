/**
 * Geometria della board condivisa da chi disegna la griglia (Board.tsx) e da
 * chi posiziona elementi sopra di essa in percentuale (TokenLayer, FlagLayer).
 *
 * La griglia NON ha celle tutte uguali: la prima e l'ultima traccia di ogni
 * asse valgono CORNER_WEIGHT volte una traccia normale, così gli angoli sono
 * quadrati più grandi e le caselle laterali rettangoli col lato lungo
 * perpendicolare al bordo (proporzioni misurate sul riferimento visivo:
 * cornice 172px, passo casella 113px → 172/113 ≈ 1.52).
 *
 * Tenere il calcolo qui evita il bug per cui la griglia usava le tracce pesate
 * mentre i livelli sovrapposti continuavano a dividere per il numero di celle,
 * sfasando bandierine e pedine rispetto alle caselle.
 */
export const CORNER_WEIGHT = 1.52;

/** Somma dei pesi delle tracce di un asse con `count` celle. */
export function axisTotal(count: number): number {
  return count - 2 + CORNER_WEIGHT * 2;
}

/** Inizio della cella `index` (in unità di traccia, dall'origine dell'asse). */
function axisStart(index: number, count: number): number {
  if (index <= 0) return 0;
  return CORNER_WEIGHT + (Math.min(index, count - 1) - 1);
}

/** Dimensione della cella `index` (in unità di traccia). */
function axisSize(index: number, count: number): number {
  return index === 0 || index === count - 1 ? CORNER_WEIGHT : 1;
}

/** Bordo iniziale della cella, in percentuale della board. */
export function edgeStartPercent(index: number, count: number): number {
  return (axisStart(index, count) / axisTotal(count)) * 100;
}

/** Bordo finale della cella, in percentuale della board. */
export function edgeEndPercent(index: number, count: number): number {
  return ((axisStart(index, count) + axisSize(index, count)) / axisTotal(count)) * 100;
}

/** Centro della cella, in percentuale della board. */
export function centerPercent(index: number, count: number): number {
  return ((axisStart(index, count) + axisSize(index, count) / 2) / axisTotal(count)) * 100;
}
