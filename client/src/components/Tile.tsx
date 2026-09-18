import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Tile as TileData, TileType } from "@morichup/shared";
import { flagFor } from "../lib/flags";
import { CountryFlag } from "./flags";
import {
  AirportIcon,
  ChestIcon,
  ElectricIcon,
  HotelIcon,
  HouseIcon,
  SkullIcon,
  StartArrowIcon,
  VacationIcon,
  WaterIcon,
} from "./icons";

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
  /** Lato rivolto verso il centro del tabellone: la barra colore va lì, più
   * visibile che sempre in basso (che su metà delle caselle era il lato
   * "sbagliato", rivolto fuori dal tabellone). Default "bottom" per i
   * chiamanti che non lo passano (es. editor mappe). */
  ownerBarSide?: "top" | "bottom" | "left" | "right";
  /** Cambia ogni volta che una pedina qualsiasi termina un movimento su questa
   * casella (non solo quando cambia proprietario, a differenza del pulse di
   * .board-tile--owned): fa scattare un flash breve col colore di chi arriva. */
  landNonce?: number;
  landColor?: string;
  /** True per un momento quando questa casella è il bersaglio di una riga di
   * log appena cliccata (vedi EventLog.tsx/eventTarget): un'evidenziazione
   * più lunga e marcata del flash di atterraggio, non legata a una pedina. */
  eventHighlighted?: boolean;
  /** Fase 9: l'editor mappe riusa questo stesso componente per il rendering,
   * aggiungendo solo l'interazione al click (non usato durante una partita). */
  onClick?: () => void;
}

/** Contenuto compatto per il badge circolare di tipo, per le caselle non-property:
 * icona SVG dove serve un simbolo pittorico, testo semplice ("?", "$") dove un
 * glifo tipografico è già chiaro di suo e non stona come le emoji sostituite. */
function typeBadge(type: TileType, name: string): ReactNode | null {
  switch (type) {
    case "railroad":
      return <AirportIcon className="board-tile__type-badge-icon" />;
    case "utility":
      // Le due utility si distinguono solo per nome ("Water"/"Power"/"Electric"),
      // non hanno un campo dedicato: stessa euristica usata dal riferimento.
      return /water/i.test(name) ? (
        <WaterIcon className="board-tile__type-badge-icon" />
      ) : (
        <ElectricIcon className="board-tile__type-badge-icon" />
      );
    case "communityChest":
      return <ChestIcon className="board-tile__type-badge-icon board-tile__type-badge-icon--chest" />;
    case "chance":
      return <span className="board-tile__type-badge-surprise">?</span>;
    case "incomeTax":
    case "luxuryTax":
      return "$";
    default:
      return null;
  }
}

/** Icona/pattern distintivo per ognuna delle quattro caselle d'angolo. */
function CornerGlyph({ type }: { type: TileType }) {
  switch (type) {
    case "start":
      return <StartArrowIcon className="board-tile__corner-icon board-tile__corner-icon--start" />;
    case "jail":
      return (
        <svg viewBox="0 0 24 24" className="board-tile__corner-icon" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
        </svg>
      );
    case "freeParking":
      return <VacationIcon className="board-tile__corner-icon board-tile__corner-icon--vacation" />;
    case "goToJail":
      return <SkullIcon className="board-tile__corner-icon board-tile__corner-icon--gotojail" />;
    default:
      return null;
  }
}

export default function Tile({
  tile,
  isCorner,
  isHighlighted,
  highlightColor,
  ownerColor,
  ownerBarSide = "bottom",
  landNonce,
  landColor,
  eventHighlighted,
  onClick,
}: TileProps) {
  const flag = tile.type === "property" ? flagFor(tile.name) : null;
  const houseCount = tile.hotel ? 0 : (tile.houses ?? 0);
  const badge = !isCorner && tile.type !== "property" ? typeBadge(tile.type, tile.name) : null;

  // Nelle colonne laterali il contenuto della casella (icona + nome + prezzo)
  // ruota in blocco, non solo il nome: nel riferimento a sinistra il testo si
  // legge dall'alto verso il basso (rotazione oraria), a destra dal basso
  // verso l'alto (antioraria). ownerBarSide indica il lato rivolto al centro,
  // quindi "right" = colonna di sinistra e "left" = colonna di destra.
  const contentRotation = isCorner
    ? null
    : ownerBarSide === "right"
      ? "cw"
      : ownerBarSide === "left"
        ? "ccw"
        : null;
  // La fascia del gruppo sta sempre sul bordo ESTERNO della board, cioè il
  // lato opposto a quello rivolto al centro.
  const bandSide = { top: "bottom", bottom: "top", left: "right", right: "left" }[ownerBarSide];
  // Spazio da lasciare libero dove sporge la bandierina, espresso nel sistema
  // di riferimento del contenuto (cioè PRIMA della rotazione): per la riga in
  // alto il lato interno resta in basso, in tutti gli altri casi finisce in
  // alto (le colonne laterali ruotano, quindi il loro "top" guarda al centro).
  const flagPad = ownerBarSide === "bottom" ? "bottom" : "top";

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
      className={`board-tile board-tile--type-${tile.type}${isCorner ? " board-tile--corner" : ""}${isHighlighted ? " board-tile--highlighted" : ""}${ownerColor ? " board-tile--owned" : ""}${onClick ? " board-tile--clickable" : ""}${landing ? " board-tile--landing" : ""}${eventHighlighted ? " board-tile--event-highlight" : ""}`}
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
      {tile.groupColor && <div className={`board-tile__band board-tile__band--${bandSide}`} />}
      {flag && (
        <span className="board-tile__flag-bg-wrap" aria-hidden="true">
          {/* "none": lo sfondo deve riempire tutta la casella, senza le bande
           * vuote che il fit proporzionale lasciava su Spagna, Grecia, Italia. */}
          <CountryFlag code={flag} className="board-tile__flag-watermark" preserveAspectRatio="none" />
        </span>
      )}
      {isCorner && tile.type === "jail" ? (
        <div className="board-tile__jail-split">
          <span className="board-tile__jail-split-zone board-tile__jail-split-zone--jail">
            <CornerGlyph type="jail" />
            <span className="board-tile__jail-split-label">Jail</span>
          </span>
          <span className="board-tile__jail-split-zone board-tile__jail-split-zone--visiting">
            <span className="board-tile__jail-split-label">Just Visiting</span>
          </span>
        </div>
      ) : (
        <div
          className={`board-tile__content${contentRotation ? ` board-tile__content--${contentRotation}` : ""}${
            flag ? ` board-tile__content--flagpad-${flagPad}` : ""
          }`}
        >
          {isCorner && <CornerGlyph type={tile.type} />}
          {badge && (
            <span className="board-tile__type-badge" aria-hidden="true">
              {badge}
            </span>
          )}
          <span className={`board-tile__name${tile.name.length > 12 ? " board-tile__name--long" : ""}`}>
            {tile.name}
          </span>
          {tile.purchasePrice !== undefined && (
            <span className={`board-tile__price${ownerColor ? " board-tile__price--owned" : ""}`}>
              ${tile.purchasePrice}
            </span>
          )}
        </div>
      )}
      {tile.hotel && (
        <span className="board-tile__buildings board-tile__buildings--hotel" title="Hotel">
          <HotelIcon className="board-tile__building-icon" />
        </span>
      )}
      {houseCount > 0 && (
        <span className="board-tile__buildings" title={`${houseCount} case`}>
          <HouseIcon className="board-tile__building-icon" />
          {houseCount > 1 && <span className="board-tile__buildings-count">×{houseCount}</span>}
        </span>
      )}
      {ownerColor && (
        <div className={`board-tile__owner-bar board-tile__owner-bar--${ownerBarSide}`} style={{ backgroundColor: ownerColor }} />
      )}
    </div>
  );
}
