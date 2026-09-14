// Costanti di regola per la modalità Classic (non ancora configurabili dall'host).
export const JAIL_FINE = 50;
export const MAX_JAIL_ATTEMPTS = 3;
export const DOUBLES_TO_JAIL = 3;

/** Multa fissa se un'accusa di promessa infranta viene votata Guilty (PRD §25: penalità configurabile). */
export const CONTRACT_PENALTY = 100;
/** Finestra di voto per un'accusa prima della risoluzione forzata (PRD §25). */
export const ACCUSATION_VOTE_WINDOW_SECONDS = 30;

/** Numero massimo di case su una proprietà prima di poter costruire l'hotel. */
export const MAX_HOUSES = 4;
/**
 * I dati mappa (`rentLevels`) hanno 4 soli livelli (1-4 case): nessun valore
 * dedicato per l'hotel. Invece di editare a mano le 4 mappe generate, il rent
 * dell'hotel è calcolato come un moltiplicatore del rent a 4 case, in linea
 * con il rapporto tipico del Monopoly classico (es. Mediterranean 160→250 ≈ 1.56x).
 */
export const HOTEL_RENT_MULTIPLIER = 1.5;

// Nota: l'indice della casella "jail" NON è una costante fissa (varia da mappa a
// mappa: vedi GameEngine, che lo ricava da board.tiles alla costruzione).
