import type { Player, Tile as TileData } from "@morichup/shared";
import PlayerToken from "./PlayerToken";

interface TileProps {
  tile: TileData;
  players: Player[];
  isCorner: boolean;
}

export default function Tile({ tile, players, isCorner }: TileProps) {
  return (
    <div
      className={`board-tile${isCorner ? " board-tile--corner" : ""}`}
      style={{ gridColumn: tile.position.x + 1, gridRow: tile.position.y + 1 }}
    >
      {tile.groupColor && (
        <div className="board-tile__band" style={{ backgroundColor: tile.groupColor }} />
      )}
      <span className="board-tile__name">{tile.name}</span>
      {tile.purchasePrice !== undefined && (
        <span className="board-tile__price">${tile.purchasePrice}</span>
      )}
      <div className="board-tile__tokens">
        {players.map((player, i) => (
          <PlayerToken key={player.sessionId} player={player} stackIndex={i} />
        ))}
      </div>
    </div>
  );
}
