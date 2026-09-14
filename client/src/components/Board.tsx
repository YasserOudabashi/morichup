import type { BoardConfig, Player } from "@morichup/shared";
import Tile from "./Tile";

interface BoardProps {
  board: BoardConfig;
  players: Player[];
}

const CORNER_TYPES = new Set(["start", "jail", "freeParking", "goToJail"]);

export default function Board({ board, players }: BoardProps) {
  const aspectRatio = board.width / board.height;
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
      </div>
      {board.tiles.map((tile, index) => (
        <Tile
          key={tile.id}
          tile={tile}
          isCorner={CORNER_TYPES.has(tile.type)}
          players={players.filter((p) => p.position === index)}
        />
      ))}
    </div>
  );
}
