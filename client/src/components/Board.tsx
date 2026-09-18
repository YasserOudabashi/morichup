import type { BoardConfig, ClientIntent, GameState, Player, PlayerSessionId, ServerEvent } from "@morichup/shared";
import Tile from "./Tile";
import Dice from "./Dice";
import TokenLayer from "./TokenLayer";
import type { DiceRoll, MoveBatch } from "../state/useGameConnection";
import { useAnimatedPositions } from "../hooks/useAnimatedPositions";
import { describeEvent } from "./EventLog";
import { t } from "../i18n";

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
}

const CORNER_TYPES = new Set(["start", "jail", "freeParking", "goToJail"]);
const TICKER_LENGTH = 3;

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
}: BoardProps) {
  const aspectRatio = board.width / board.height;
  const hoveredPlayer = hoveredPlayerId ? players.find((p) => p.sessionId === hoveredPlayerId) : null;
  const rollingPlayer = diceRoll ? players.find((p) => p.sessionId === diceRoll.playerId) : null;
  const { displayPositions, arrivedNonces } = useAnimatedPositions(players, board, moveBatch);
  const colorByPlayerId = new Map(players.map((p) => [p.sessionId, p.color]));

  const me = gameState && sessionId ? gameState.players.find((p) => p.sessionId === sessionId) : null;
  const canRollHere =
    !!gameState &&
    !!onIntent &&
    !!me &&
    gameState.state === "ROLLING" &&
    gameState.currentTurnPlayerId === sessionId &&
    !me.inJail;

  const tickerLines = (events ?? [])
    .slice(-TICKER_LENGTH)
    .reverse()
    .map((event, i) => ({ id: i, text: describeEvent(event, board, players, gameState?.accusations ?? []) }))
    .filter((l) => l.text);

  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: `repeat(${board.width}, 1fr)`,
        gridTemplateRows: `repeat(${board.height}, 1fr)`,
        aspectRatio: `${board.width} / ${board.height}`,
        width: `min(90vw, calc(78vh * ${aspectRatio}))`,
      }}
    >
      <div
        className="board__center"
        style={{ gridColumn: `2 / ${board.width}`, gridRow: `2 / ${board.height}` }}
      >
        <span className="board__center-title">{board.name}</span>
        <Dice roll={diceRoll ?? null} />
        {rollingPlayer && (
          <span className="board__center-roller" style={{ color: rollingPlayer.color }}>
            {rollingPlayer.nickname}
          </span>
        )}
        {canRollHere && (
          <button
            type="button"
            className="btn btn--primary btn--large board__center-roll-btn"
            onClick={() => onIntent!({ type: "ROLL_DICE" })}
          >
            🎲 {t("game.rollDice")}
          </button>
        )}
        {tickerLines.length > 0 && (
          <ul className="board__ticker">
            {tickerLines.map((line) => (
              <li key={line.id} className="board__ticker-line">
                {line.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {board.tiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          isCorner={CORNER_TYPES.has(tile.type)}
          isHighlighted={hoveredPlayer != null && tile.ownerId === hoveredPlayer.sessionId}
          highlightColor={hoveredPlayer?.color}
          ownerColor={tile.ownerId ? colorByPlayerId.get(tile.ownerId) : undefined}
        />
      ))}
      <TokenLayer board={board} players={players} displayPositions={displayPositions} arrivedNonces={arrivedNonces} />
    </div>
  );
}
