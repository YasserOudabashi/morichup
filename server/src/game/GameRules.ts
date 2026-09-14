// Costanti di regola per la modalità Classic (non ancora configurabili dall'host).
export const JAIL_FINE = 50;
export const MAX_JAIL_ATTEMPTS = 3;
export const DOUBLES_TO_JAIL = 3;

// Nota: l'indice della casella "jail" NON è una costante fissa (varia da mappa a
// mappa: vedi GameEngine, che lo ricava da board.tiles alla costruzione).
