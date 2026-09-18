// Pedina come un semplice cerchio con una faccina (richiesto esplicitamente:
// "kruglyashki" come nel riferimento visivo, non più una goccia con testa).
// Resta interamente generata via SVG (nessun asset esterno), colorata
// dinamicamente col colore del giocatore. Condivisa tra il token sulla
// board e l'avatar nella HUD, così è sempre lo stesso "personaggio".
export function TokenSprite({ shapeIndex }: { shapeIndex: number }) {
  // Un piccolo accessorio in cima diverso per variante, per distinguere le
  // pedine anche a colpo d'occhio oltre al colore — il cerchio resta però
  // sempre la forma dominante.
  const variant = shapeIndex % 3;
  return (
    <svg viewBox="0 0 28 28" width="24" height="24" className="player-token__svg" aria-hidden="true">
      <ellipse className="player-token__shadow" cx="14" cy="26.5" rx="8" ry="1.8" />
      <circle className="player-token__body" cx="14" cy="14" r="11" />
      {variant === 1 && <circle className="player-token__accent" cx="14" cy="3.2" r="2" />}
      {variant === 2 && <rect className="player-token__accent" x="9" y="1.8" width="10" height="2.6" rx="1.3" />}
      <circle className="player-token__eye" cx="10.4" cy="13" r="1.6" />
      <circle className="player-token__eye" cx="17.6" cy="13" r="1.6" />
      <path className="player-token__smile" d="M10 17.5q4 3 8 0" />
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
