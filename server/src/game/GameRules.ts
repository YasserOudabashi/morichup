// Costanti di regola per la modalità Classic (non ancora configurabili dall'host).
export const JAIL_FINE = 50;
export const MAX_JAIL_ATTEMPTS = 3;
export const DOUBLES_TO_JAIL = 3;

/** Multa fissa se un'accusa di promessa infranta viene votata Guilty (PRD §25: penalità configurabile). */
export const CONTRACT_PENALTY = 100;
/** Finestra di voto per un'accusa prima della risoluzione forzata (PRD §25). */
export const ACCUSATION_VOTE_WINDOW_SECONDS = 30;

// Nota: l'indice della casella "jail" NON è una costante fissa (varia da mappa a
// mappa: vedi GameEngine, che lo ricava da board.tiles alla costruzione).
