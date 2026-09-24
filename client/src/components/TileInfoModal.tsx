import { useEffect, useRef } from "react";
import type { Player, Tile } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
import { COMMUNITY_CHEST_CARD_TEXTS, FORTUNE_CARD_TEXTS } from "../lib/cardDecks";

interface TileInfoModalProps {
  tile: Tile;
  owner: Player | null;
  onClose: () => void;
  /** Punto del click sulla casella: il popup si ancora lì vicino, non più al
   * centro dello schermo a tutta pagina (richiesto esplicitamente). */
  anchor: { x: number; y: number };
}

/** Le righe daffitto vanno mostrate nell'ordine "base, 1 casa, 2 case, 3 case,
 * 4 case, hotel": rentLevels[0..3] sono le case, l'ultimo elemento è l'hotel
 * (stessa convenzione usata dal motore regole lato server). */
function rentRows(tile: Tile): { label: string; amount: number }[] {
  const rows: { label: string; amount: number }[] = [];
  if (tile.baseRent !== undefined) {
    rows.push({ label: t("tileInfo.rentBase"), amount: tile.baseRent });
  }
  if (tile.rentLevels) {
    tile.rentLevels.forEach((amount, i) => {
      const isHotel = i === tile.rentLevels!.length - 1;
      rows.push({
        label: isHotel
          ? t("tileInfo.rentHotel")
          : t(i + 1 === 1 ? "tileInfo.rentHouse" : "tileInfo.rentHouses", { count: i + 1 }),
        amount,
      });
    });
  }
  return rows;
}

export default function TileInfoModal({ tile, owner, onClose, anchor }: TileInfoModalProps) {
  useEscapeToClose(onClose);
  const rows = rentRows(tile);
  const ref = useRef<HTMLDivElement>(null);
  // Richiesto esplicitamente: cliccando su Fortuna/Cassa Comune si vede subito
  // l'intera lista di carte possibili, non solo il nome della casella.
  const deckTexts =
    tile.type === "chance" ? FORTUNE_CARD_TEXTS : tile.type === "communityChest" ? COMMUNITY_CHEST_CARD_TEXTS : null;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  // Ancorato al punto del click, ma spostato dentro i bordi della finestra
  // (con un margine) così non finisce mai a metà fuori schermo su una
  // casella vicino al bordo.
  const MARGIN = 12;
  const POPUP_WIDTH = 260;
  const RESERVED_HEIGHT = deckTexts ? 340 : 200;
  const left = Math.min(Math.max(anchor.x, MARGIN), window.innerWidth - POPUP_WIDTH - MARGIN);
  const top = Math.min(anchor.y + 12, window.innerHeight - RESERVED_HEIGHT);

  return (
    <div
      ref={ref}
      className="card card--narrow tile-info-modal tile-info-modal--anchored"
      style={
        {
          left,
          top,
          ...(tile.groupColor ? { "--tile-group-color": tile.groupColor } : {}),
        } as React.CSSProperties
      }
    >
        {tile.groupColor && <div className="tile-info-modal__band" />}
        <h3 className="tile-info-modal__title">{tile.name}</h3>
        {owner && (
          <p className="tile-info-modal__owner" style={{ color: owner.color }}>
            {t("tileInfo.ownedBy", { name: owner.nickname })}
          </p>
        )}
        {tile.purchasePrice !== undefined && (
          <p className="tile-info-modal__price">
            {t("tileInfo.price")}: ${tile.purchasePrice}
          </p>
        )}
        {tile.mortgaged && <p className="tile-info-modal__mortgaged">{t("tileInfo.mortgaged")}</p>}
        {rows.length > 0 && (
          <table className="tile-info-modal__rent-table">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>${row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(tile.houseCost !== undefined || tile.hotelCost !== undefined) && (
          <p className="tile-info-modal__build-cost">
            {tile.houseCost !== undefined && <span>{t("tileInfo.houseCost")}: ${tile.houseCost}</span>}
            {tile.hotelCost !== undefined && <span>{t("tileInfo.hotelCost")}: ${tile.hotelCost}</span>}
          </p>
        )}
        {tile.amount !== undefined && (
          <p className="tile-info-modal__price">
            {t("tileInfo.amount")}: ${tile.amount}
          </p>
        )}
        {deckTexts && (
          <>
            <p className="tile-info-modal__deck-label">{t("tileInfo.deckContents")}</p>
            <ul className="tile-info-modal__deck-list">
              {deckTexts.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="btn btn--ghost btn--small tile-info-modal__close" onClick={onClose}>
          {t("common.close")}
        </button>
    </div>
  );
}
