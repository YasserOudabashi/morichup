import type { Player, Tile } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";

interface TileInfoModalProps {
  tile: Tile;
  owner: Player | null;
  onClose: () => void;
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

export default function TileInfoModal({ tile, owner, onClose }: TileInfoModalProps) {
  useEscapeToClose(onClose);
  const rows = rentRows(tile);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card card--narrow tile-info-modal"
        style={tile.groupColor ? ({ "--tile-group-color": tile.groupColor } as React.CSSProperties) : undefined}
        onClick={(e) => e.stopPropagation()}
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
        <button type="button" className="btn btn--ghost btn--small tile-info-modal__close" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
