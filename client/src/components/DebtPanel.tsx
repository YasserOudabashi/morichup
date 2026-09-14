import type { BoardConfig, ClientIntent, Player } from "@morichup/shared";
import { t } from "../i18n";

interface DebtPanelProps {
  player: Player;
  board: BoardConfig;
  onIntent: (intent: ClientIntent) => void;
}

/** Mostrato a qualsiasi giocatore con debiti pendenti, anche fuori dal proprio
 * turno (PRD §28-30): può vendere proprietà alla banca o dichiarare bancarotta
 * in qualsiasi momento, indipendentemente da chi sta giocando ora. */
export default function DebtPanel({ player, board, onIntent }: DebtPanelProps) {
  const totalOwed = player.pendingDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const ownedTiles = player.properties
    .map((id) => board.tiles.find((tile) => tile.id === id))
    .filter((tile): tile is NonNullable<typeof tile> => Boolean(tile));

  function handleBankruptcy() {
    if (window.confirm(t("debt.bankruptcyConfirm"))) {
      onIntent({ type: "DECLARE_BANKRUPTCY" });
    }
  }

  return (
    <div className="action-panel debt-panel">
      <p className="debt-panel__title">{t("debt.title")}</p>
      <p className="debt-panel__owed">{t("debt.owed", { amount: totalOwed })}</p>

      {ownedTiles.length === 0 ? (
        <p className="waiting-notice">{t("debt.noPropertiesLeft")}</p>
      ) : (
        <div className="debt-panel__properties">
          {ownedTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => onIntent({ type: "SELL_PROPERTY_TO_BANK", tileId: tile.id })}
            >
              {t("debt.sellProperty", { tile: tile.name, price: Math.floor((tile.purchasePrice ?? 0) / 2) })}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="btn btn--danger" onClick={handleBankruptcy}>
        {t("debt.declareBankruptcy")}
      </button>
    </div>
  );
}
