import type { BoardConfig, Player, PlayerSessionId } from "@morichup/shared";
import Tile from "./Tile";
import Dice from "./Dice";
import TokenLayer from "./TokenLayer";
import type { DiceRoll, MoveBatch } from "../state/useGameConnection";
import { useAnimatedPositions } from "../hooks/useAnimatedPositions";

interface BoardProps {
  board: BoardConfig;
  players: Player[];
  hoveredPlayerId?: PlayerSessionId | null;
  diceRoll?: DiceRoll | null;
  moveBatch?: MoveBatch | null;
}

const CORNER_TYPES = new Set(["start", "jail", "freeParking", "goToJail"]);

export default function Board({ board, players, hoveredPlayerId, diceRoll, moveBatch = null }: BoardProps) {
  const aspectRatio = board.width / board.height;
  const hoveredPlayer = hoveredPlayerId ? players.find((p) => p.sessionId === hoveredPlayerId) : null;
  const rollingPlayer = diceRoll ? players.find((p) => p.sessionId === diceRoll.playerId) : null;
  const { displayPositions, arrivedNonces } = useAnimatedPositions(players, board, moveBatch);
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
      </div>
      {board.tiles.map((tile) => (
        <Tile
          key={tile.id}
          tile={tile}
          isCorner={CORNER_TYPES.has(tile.type)}
          isHighlighted={hoveredPlayer != null && tile.ownerId === hoveredPlayer.sessionId}
          highlightColor={hoveredPlayer?.color}
        />
      ))}
      <TokenLayer board={board} players={players} displayPositions={displayPositions} arrivedNonces={arrivedNonces} />
    </div>
  );
}
