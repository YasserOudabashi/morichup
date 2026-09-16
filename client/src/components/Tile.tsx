import type { CSSProperties } from "react";
import type { Tile as TileData } from "@morichup/shared";
import { flagFor } from "../lib/flags";

interface TileProps {
  tile: TileData;
  isCorner: boolean;
  isHighlighted?: boolean;
  highlightColor?: string;
}

export default function Tile({ tile, isCorner, isHighlighted, highlightColor }: TileProps) {
  const flag = tile.type === "property" ? flagFor(tile.name) : null;
  const buildings = tile.hotel ? "🏨" : tile.houses ? "🏠".repeat(tile.houses) : null;

  return (
    <div
      className={`board-tile${isCorner ? " board-tile--corner" : ""}${isHighlighted ? " board-tile--highlighted" : ""}`}
      style={{
        gridColumn: tile.position.x + 1,
        gridRow: tile.position.y + 1,
        ...(highlightColor ? { "--tile-highlight-color": highlightColor } : {}),
      } as CSSProperties}
    >
      {tile.groupColor && (
        <div className="board-tile__band" style={{ backgroundColor: tile.groupColor }} />
      )}
      {flag && (
        <span className="board-tile__flag" aria-hidden="true">
          {flag}
        </span>
      )}
      <span className="board-tile__name">{tile.name}</span>
      {tile.purchasePrice !== undefined && (
        <span className="board-tile__price">${tile.purchasePrice}</span>
      )}
      {buildings && (
        <span className="board-tile__buildings" aria-hidden="true">
          {buildings}
        </span>
      )}
    </div>
  );
}
