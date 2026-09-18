// Forma "pedina" disegnata via SVG inline: corpo a goccia + testa tonda, così
// ogni giocatore ha una piccola figura riconoscibile invece di un semplice
// pallino, ma resta interamente generata (nessun asset esterno) e colorata
// dinamicamente col colore assegnato al giocatore. Condivisa tra il token
// sulla board e l'avatar nella HUD, così è sempre lo stesso "personaggio".
export function TokenSprite({ shapeIndex }: { shapeIndex: number }) {
  // Alcune varianti di "cappello"/silhouette a seconda dell'indice del
  // giocatore, per distinguere le pedine anche a colpo d'occhio oltre al colore.
  const variant = shapeIndex % 3;
  return (
    <svg viewBox="0 0 28 32" width="24" height="27" className="player-token__svg" aria-hidden="true">
      <ellipse className="player-token__shadow" cx="14" cy="29" rx="8" ry="2.4" />
      <path
        className="player-token__body"
        d="M14 30c-5.2 0-8.6-3.1-8.6-7.4 0-4.6 3.2-8.9 5.4-12.4C12.1 8 13 6.6 14 6.6s1.9 1.4 3.2 3.6c2.2 3.5 5.4 7.8 5.4 12.4 0 4.3-3.4 7.4-8.6 7.4Z"
      />
      <circle className="player-token__head" cx="14" cy="7.2" r="6" />
      {variant === 1 && <rect className="player-token__accent" x="9.5" y="1.6" width="9" height="2.4" rx="1.2" />}
      {variant === 2 && <circle className="player-token__accent" cx="14" cy="1.8" r="1.9" />}
      <circle className="player-token__eye" cx="11.6" cy="6.8" r="1.15" />
      <circle className="player-token__eye" cx="16.4" cy="6.8" r="1.15" />
    </svg>
  );
}

// Hash stabile sull'id del giocatore: la forma della pedina resta la stessa
// per tutta la partita, indipendente dall'ordine di stack sulla casella.
export function shapeIndexFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % 3;
}
