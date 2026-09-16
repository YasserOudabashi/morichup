import type { CSSProperties } from "react";
import type { Tile as TileData } from "@morichup/shared";
import { flagFor } from "../lib/flags";

interface TileProps {
  tile: TileData;
  isCorner: boolean;
  isHighlighted?: boolean;
  highlightColor?: string;
  /** Colore del proprietario, se posseduta: mostrato sempre, non solo su hover. */
  ownerColor?: string;
}

export default function Tile({ tile, isCorner, isHighlighted, highlightColor, ownerColor }: TileProps) {
  const flag = tile.type === "property" ? flagFor(tile.name) : null;
  const houseCount = tile.hotel ? 0 : (tile.houses ?? 0);

  return (
    <div
      className={`board-tile${isCorner ? " board-tile--corner" : ""}${isHighlighted ? " board-tile--highlighted" : ""}${ownerColor ? " board-tile--owned" : ""}`}
      style={{
        gridColumn: tile.position.x + 1,
        gridRow: tile.position.y + 1,
        ...(highlightColor ? { "--tile-highlight-color": highlightColor } : {}),
        ...(ownerColor ? { "--owner-color": ownerColor } : {}),
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
      {tile.hotel && (
        <span className="board-tile__buildings board-tile__buildings--hotel" aria-hidden="true" title="Hotel">
          🏨
        </span>
      )}
      {houseCount > 0 && (
        <span className="board-tile__buildings" aria-hidden="true" title={`${houseCount} case`}>
          {"🏠".repeat(houseCount)}
        </span>
      )}
      {ownerColor && <div className="board-tile__owner-bar" style={{ backgroundColor: ownerColor }} />}
    </div>
  );
}
