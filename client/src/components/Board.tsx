import type { BoardConfig, ClientIntent, GameState, Player, PlayerSessionId, ServerEvent } from "@morichup/shared";
import Tile from "./Tile";
import Dice from "./Dice";
import TokenLayer from "./TokenLayer";
import FlagLayer from "./FlagLayer";
import type { DiceRoll, MoveBatch } from "../state/useGameConnection";
import { useAnimatedPositions } from "../hooks/useAnimatedPositions";
import { describeEvent, eventTarget, type EventTarget as LogEventTarget } from "./EventLog";
import { t } from "../i18n";
import { DiceIcon } from "./icons";
import { CORNER_WEIGHT, axisTotal } from "../lib/boardGeometry";
import { flagFor } from "../lib/flags";
import { CountryFlag } from "./flags";

interface BoardProps {
  board: BoardConfig;
  players: Player[];
  hoveredPlayerId?: PlayerSessionId | null;
  diceRoll?: DiceRoll | null;
  moveBatch?: MoveBatch | null;
  /** Passati solo in partita (non nel replay): mostrano il bottone "tira i
   * dadi" al centro della board quando è il turno del giocatore locale. */
  gameState?: GameState | null;
  sessionId?: PlayerSessionId | null;
  onIntent?: (intent: ClientIntent) => void;
  /** Ultimi eventi da riassumere in un mini-ticker al centro della board. */
  events?: ServerEvent[];
  /** Id della casella da evidenziare per un attimo, cliccata dal log eventi. */
  eventHighlightTileId?: string | null;
  /** Stesso comportamento di click del log laterale, applicato anche alle
   * righe della cronologia al centro della board. */
  onSelectEvent?: (target: LogEventTarget) => void;
  /** Click su una casella qualunque: apre il popup con le info (affitti per
   * numero di case, costo costruzione, ecc.). Assente nel replay/editor. */
  onSelectTile?: (tileId: string, x: number, y: number) => void;
}

const CORNER_TYPES = new Set(["start", "jail", "freeParking", "goToJail"]);
/* Richiesto esplicitamente: poter scorrere indietro fino alle ultime ~50
 * cose successe, non solo le 10 più recenti — il contenitore stesso è
 * scrollabile (vedi .board__ticker in theme.css), quindi qui basta non
 * tagliare la lista troppo presto. */
const TICKER_LENGTH = 50;

/** Su quale lato della casella mostrare la barra del proprietario: quello
 * rivolto verso il centro del tabellone, non sempre in basso — su un bordo
 * top/bottom il centro è verticale, su un bordo left/right è orizzontale. */
function ownerBarSide(x: number, y: number, width: number, height: number): "top" | "bottom" | "left" | "right" {
  if (y === 0) return "bottom";
  if (y === height - 1) return "top";
  if (x === 0) return "right";
  return "left";
}

export default function Board({
  board,
  players,
  hoveredPlayerId,
  diceRoll,
  moveBatch = null,
  gameState,
  sessionId,
  onIntent,
  events,
  eventHighlightTileId,
  onSelectEvent,
  onSelectTile,
}: BoardProps) {
  const aspectRatio = board.width / board.height;
  const hoveredPlayer = hoveredPlayerId ? players.find((p) => p.sessionId === hoveredPlayerId) : null;
  const rollingPlayer = diceRoll ? players.find((p) => p.sessionId === diceRoll.playerId) : null;
  // Prima mostrava il nome di chi tira solo DURANTE il lancio (diceRoll):
  // tra la fine di un turno e il click su "tira i dadi" del prossimo non si
  // vedeva nessun nome, anche se il prossimo giocatore era già determinato
  // (gameState.currentTurnPlayerId) — richiesto esplicitamente che appaia subito.
  const currentTurnPlayer = gameState ? players.find((p) => p.sessionId === gameState.currentTurnPlayerId) : null;
  const displayedTurnPlayer = rollingPlayer ?? currentTurnPlayer;
  const { displayPositions, arrivedNonces, moveDurations } = useAnimatedPositions(players, board, moveBatch);
  const colorByPlayerId = new Map(players.map((p) => [p.sessionId, p.color]));

  // Casella su cui una pedina è appena atterrata (arrivedNonces cambia solo
  // a fine movimento, mai durante l'attraversamento): usato per un flash
  // distinto dal pulse di cambio proprietario, che scatta su ogni arrivo,
  // non solo quando la casella cambia mano.
  const landingByTile = new Map<number, { nonce: number; color: string }>();
  for (const player of players) {
    const nonce = arrivedNonces[player.sessionId];
    if (nonce === undefined) continue;
    const tileIndex = displayPositions[player.sessionId] ?? player.position;
    landingByTile.set(tileIndex, { nonce, color: player.color });
  }

  const me = gameState && sessionId ? gameState.players.find((p) => p.sessionId === sessionId) : null;
  const isMyTurnHere = !!gameState && !!me && gameState.currentTurnPlayerId === sessionId;
  const canRollHere = !!gameState && !!onIntent && !!me && gameState.state === "ROLLING" && isMyTurnHere && !me.inJail;
  const canRollInJail = !!gameState && !!onIntent && !!me && gameState.state === "ROLLING" && isMyTurnHere && me.inJail;
  const buyDecisionTile =
    gameState && onIntent && isMyTurnHere && gameState.pendingDecision?.type === "buyOrDecline"
      ? board.tiles.find((tl) => tl.id === gameState.pendingDecision!.tileId)
      : null;
  // pendingDecision può restare "buyOrDecline" anche a stato PLAYER_DECISION
  // (bug trovato con lo screenshot: comprare/rifiutare e fine turno apparivano
  // insieme) — la decisione d'acquisto ha sempre la precedenza.
  const canEndTurn = !!gameState && !!onIntent && isMyTurnHere && gameState.state === "PLAYER_DECISION" && !buyDecisionTile;

  // `events` arriva già più-recente-per-primo (vedi il commento in useGameConnection.ts
  // su onGameEvents): slice(0, N) prende esattamente gli N più recenti, già nell'ordine
  // giusto per il riferimento visivo — il più nuovo in cima (leggibile), i più vecchi
  // via via più sbiaditi verso il basso finché non escono dalla lista.
  const tickerLines = (events ?? [])
    .slice(0, TICKER_LENGTH)
    .map((event, i) => ({
      id: i,
      text: describeEvent(event, board, players, gameState?.accusations ?? []),
      target: eventTarget(event),
    }))
    .filter((l) => l.text);

  // Proporzioni misurate sul riferimento: cornice della board 172px, passo
  // di una casella laterale 113px, quindi la traccia d'angolo vale 1.52
  // volte una traccia normale. La stessa proporzione su entrambi gli assi
  // rende il tutto simmetrico: gli angoli sono quadrati più grandi, e ogni
  // casella laterale è un rettangolo con il lato lungo perpendicolare al
  // bordo (in alto/basso più alta che larga, ai lati il contrario).
  const colTrack = `${CORNER_WEIGHT}fr repeat(${board.width - 2}, 1fr) ${CORNER_WEIGHT}fr`;
  const rowTrack = `${CORNER_WEIGHT}fr repeat(${board.height - 2}, 1fr) ${CORNER_WEIGHT}fr`;
  const weightedWidth = axisTotal(board.width);
  const weightedHeight = axisTotal(board.height);

  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: colTrack,
        gridTemplateRows: rowTrack,
        aspectRatio: `${weightedWidth} / ${weightedHeight}`,
        // Serve al CSS che ruota il contenuto delle caselle laterali: quelle
        // celle non sono quadrate, quindi il blocco ruotato deve scambiare
        // larghezza e altezza usando esattamente questo rapporto.
        ["--corner-weight" as string]: `${CORNER_WEIGHT}`,
        // Dimensionata dall'altezza disponibile DENTRO al contenitore (non dalla
        // viewport intera in "vw": su schermi larghi la board risultava piccola
        // nonostante ci fosse spazio libero, perché il calcolo ignorava le colonne
        // laterali). width:auto + height:100% + aspect-ratio fa sì che il browser
        // scelga la dimensione massima che ci sta sia in altezza sia in larghezza.
        width: "auto",
        height: "100%",
        maxWidth: "100%",
      }}
    >
      <div
        className="board__center"
        style={{ gridColumn: `2 / ${board.width}`, gridRow: `2 / ${board.height}` }}
      >
        <span className="board__center-title">{board.name}</span>
        <Dice roll={diceRoll ?? null} />
        {displayedTurnPlayer && (
          <span className="board__center-roller" style={{ color: displayedTurnPlayer.color }}>
            {displayedTurnPlayer.nickname}
          </span>
        )}
        {canRollHere && (
          <button
            type="button"
            className="btn btn--primary btn--large board__center-roll-btn"
            onClick={() => onIntent!({ type: "ROLL_DICE" })}
          >
            <DiceIcon className="board__center-roll-icon" /> {t("game.rollDice")}
          </button>
        )}
        {canRollInJail && (
          <div className="board__center-actions">
            {me!.getOutOfJailFreeCards > 0 && (
              <button type="button" className="btn btn--ghost" onClick={() => onIntent!({ type: "USE_JAIL_CARD" })}>
                {t("game.useJailCard")}
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => onIntent!({ type: "PAY_BAIL" })}>
              {t("game.payBail")}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onIntent!({ type: "ROLL_DICE" })}
            >
              <DiceIcon className="board__center-roll-icon" /> {t("game.rollDice")}
            </button>
          </div>
        )}
        {buyDecisionTile && (
          <div className="board__center-offer">
            {/* Non è un bottone, solo il riepilogo di cosa stai valutando: prima
             * sembrava un altro bottone tra i tanti, confuso con Decline/Buy. */}
            <div className="property-offer property-offer--summary">
              {(() => {
                const flag = flagFor(buyDecisionTile.name);
                return flag ? <CountryFlag code={flag} className="property-offer__flag" /> : null;
              })()}
              <span className="property-offer__name">{buyDecisionTile.name}</span>
              <span className="property-offer__price">${buyDecisionTile.purchasePrice}</span>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onIntent!({ type: "DECLINE_PROPERTY", tileId: buyDecisionTile.id })}
              >
                {t("game.decline")}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={!!me && me.money < (buyDecisionTile.purchasePrice ?? 0)}
                title={
                  me && me.money < (buyDecisionTile.purchasePrice ?? 0) ? t("game.cannotAffordProperty") : undefined
                }
                onClick={() => onIntent!({ type: "BUY_PROPERTY", tileId: buyDecisionTile.id })}
              >
                {t("game.buyProperty")}
              </button>
            </div>
          </div>
        )}
        {canEndTurn && (
          <button type="button" className="btn btn--primary btn--large board__center-roll-btn" onClick={() => onIntent!({ type: "END_TURN" })}>
            {/* Cliccare qui non finisce davvero il turno se hai fatto doppio (c'è
             * ancora un tiro extra in sospeso): l'etichetta lo dice chiaramente,
             * invece di sembrare "fine turno" quando non lo è (richiesto esplicitamente). */}
            {gameState?.extraRollPending ? t("game.rollAgainContinue") : t("game.endTurn")}
          </button>
        )}
        {tickerLines.length > 0 && (
          <ul className="board__ticker">
            {tickerLines.map((line, i) => {
              // La più recente (indice 0) è in cima e a piena leggibilità; le
              // righe successive, più vecchie, sfumano scendendo verso il basso.
              const fade = 1 - i * 0.11;
              const style = { opacity: Math.max(0.25, fade) };
              return line.target && onSelectEvent ? (
                <li key={line.id}>
                  <button
                    type="button"
                    className="board__ticker-line board__ticker-line--clickable"
                    style={style}
                    onClick={() => onSelectEvent(line.target!)}
                  >
                    {line.text}
                  </button>
                </li>
              ) : (
                <li key={line.id} className="board__ticker-line" style={style}>
                  {line.text}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* Effetto "luce di palco": quando c'è un'evidenziazione attiva (hover su
       * un giocatore, o click su una casella/proprietà), il resto della board
       * si scurisce e solo le caselle evidenziate restano a piena luce — non
       * bastava più il solo bordo colorato, richiesto esplicitamente. */}
      {(hoveredPlayer != null || eventHighlightTileId != null) && <div className="board-spotlight-overlay" />}
      {board.tiles.map((tile, i) => {
        const landing = landingByTile.get(i);
        const isHighlighted = hoveredPlayer != null && tile.ownerId === hoveredPlayer.sessionId;
        const eventHighlighted = tile.id === eventHighlightTileId;
        return (
          <Tile
            key={tile.id}
            tile={tile}
            isCorner={CORNER_TYPES.has(tile.type)}
            isHighlighted={isHighlighted}
            highlightColor={hoveredPlayer?.color}
            ownerColor={tile.ownerId ? colorByPlayerId.get(tile.ownerId) : undefined}
            ownerBarSide={ownerBarSide(tile.position.x, tile.position.y, board.width, board.height)}
            landNonce={landing?.nonce}
            landColor={landing?.color}
            eventHighlighted={eventHighlighted}
            spotlit={isHighlighted || eventHighlighted}
            onClick={onSelectTile ? (x, y) => onSelectTile(tile.id, x, y) : undefined}
          />
        );
      })}
      <FlagLayer board={board} />
      <TokenLayer
        board={board}
        players={players}
        displayPositions={displayPositions}
        arrivedNonces={arrivedNonces}
        moveDurations={moveDurations}
        activePlayerId={gameState?.currentTurnPlayerId ?? null}
        hoveredPlayerId={hoveredPlayerId ?? null}
      />
    </div>
  );
}
