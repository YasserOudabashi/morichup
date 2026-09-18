import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Tile as TileData, TileType } from "@morichup/shared";
import { flagFor } from "../lib/flags";
import { HotelIcon, HouseIcon } from "./icons";

/** Durata del flash "pedina atterrata qui": più breve del bounce della pedina
 * stessa (320ms), così il riquadro si spegne mentre la pedina sta ancora
 * facendo il suo bounce, invece di sembrare due animazioni scollegate. */
const LAND_FLASH_MS = 500;

interface TileProps {
  tile: TileData;
  isCorner: boolean;
  isHighlighted?: boolean;
  highlightColor?: string;
  /** Colore del proprietario, se posseduta: mostrato sempre, non solo su hover. */
  ownerColor?: string;
  /** Cambia ogni volta che una pedina qualsiasi termina un movimento su questa
   * casella (non solo quando cambia proprietario, a differenza del pulse di
   * .board-tile--owned): fa scattare un flash breve col colore di chi arriva. */
  landNonce?: number;
  landColor?: string;
  /** Fase 9: l'editor mappe riusa questo stesso componente per il rendering,
   * aggiungendo solo l'interazione al click (non usato durante una partita). */
  onClick?: () => void;
}

/** Simbolo compatto per il badge circolare di tipo, per le caselle non-property. */
const TYPE_BADGE: Partial<Record<TileType, string>> = {
  railroad: "🚆",
  utility: "💡",
  chance: "?",
  communityChest: "📦",
  incomeTax: "$",
  luxuryTax: "$",
};

function typeBadge(type: TileType): string | null {
  return TYPE_BADGE[type] ?? null;
}

/** Icona/pattern distintivo per ognuna delle quattro caselle d'angolo. */
function CornerGlyph({ type }: { type: TileType }) {
  switch (type) {
    case "start":
      return (
        <svg viewBox="0 0 24 24" className="board-tile__corner-icon" aria-hidden="true">
          <path d="M4 13l8-9 8 9" />
          <path d="M12 4v16" />
        </svg>
      );
    case "jail":
      return (
        <svg viewBox="0 0 24 24" className="board-tile__corner-icon" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
        </svg>
      );
    case "freeParking":
      return (
        <svg viewBox="0 0 24 24" className="board-tile__corner-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 16V8h4a3 3 0 0 1 0 6H9" />
        </svg>
      );
    case "goToJail":
      return (
        <svg viewBox="0 0 24 24" className="board-tile__corner-icon" aria-hidden="true">
          <path d="M4 12h13" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Tile({ tile, isCorner, isHighlighted, highlightColor, ownerColor, landNonce, landColor, onClick }: TileProps) {
  const flag = tile.type === "property" ? flagFor(tile.name) : null;
  const houseCount = tile.hotel ? 0 : (tile.houses ?? 0);
  const badge = !isCorner && tile.type !== "property" ? typeBadge(tile.type) : null;

  const [landing, setLanding] = useState(false);
  useEffect(() => {
    if (landNonce === undefined) return;
    setLanding(true);
    const timer = setTimeout(() => setLanding(false), LAND_FLASH_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landNonce]);

  return (
    <div
      className={`board-tile${isCorner ? " board-tile--corner" : ""}${isHighlighted ? " board-tile--highlighted" : ""}${ownerColor ? " board-tile--owned" : ""}${onClick ? " board-tile--clickable" : ""}${landing ? " board-tile--landing" : ""}`}
      style={{
        gridColumn: tile.position.x + 1,
        gridRow: tile.position.y + 1,
        ...(highlightColor ? { "--tile-highlight-color": highlightColor } : {}),
        ...(ownerColor ? { "--owner-color": ownerColor } : {}),
        ...(tile.groupColor ? { "--tile-group-color": tile.groupColor } : {}),
        ...(landing && landColor ? { "--land-color": landColor } : {}),
      } as CSSProperties}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
    >
      {tile.groupColor && <div className="board-tile__wash" />}
      {tile.groupColor && (
        <div className="board-tile__band" style={{ backgroundColor: tile.groupColor }} />
      )}
      {isCorner && <CornerGlyph type={tile.type} />}
      {flag && (
        <span className="board-tile__flag" aria-hidden="true">
          {flag}
        </span>
      )}
      {badge && (
        <span className="board-tile__type-badge" aria-hidden="true">
          {badge}
        </span>
      )}
      <span className="board-tile__name">{tile.name}</span>
      {tile.purchasePrice !== undefined && (
        <span className="board-tile__price">${tile.purchasePrice}</span>
      )}
      {tile.hotel && (
        <span className="board-tile__buildings board-tile__buildings--hotel" title="Hotel">
          <HotelIcon className="board-tile__building-icon" />
        </span>
      )}
      {houseCount > 0 && (
        <span className="board-tile__buildings" title={`${houseCount} case`}>
          {Array.from({ length: houseCount }, (_, i) => (
            <HouseIcon key={i} className="board-tile__building-icon" />
          ))}
        </span>
      )}
      {ownerColor && <div className="board-tile__owner-bar" style={{ backgroundColor: ownerColor }} />}
    </div>
  );
}
