import { useEffect, useRef } from "react";
import type { GameState, TradeAssets, TradeOffer } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";

interface TradeViewModalProps {
  gameState: GameState;
  trade: TradeOffer;
  onClose: () => void;
}

/** Vista di sola lettura di uno scambio tra due ALTRI giocatori (non il tuo):
 * niente pulsanti di risposta, solo cosa sta offrendo chi. */
export default function TradeViewModal({ gameState, trade, onClose }: TradeViewModalProps) {
  useEscapeToClose(onClose);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  function nameOf(id: string): string {
    return gameState.players.find((p) => p.sessionId === id)?.nickname ?? id;
  }

  function describeAssets(assets: TradeAssets): string {
    const parts: string[] = [];
    if (assets.cash > 0) parts.push(`$${assets.cash}`);
    for (const id of assets.propertyIds) {
      const tile = gameState.board.tiles.find((t2) => t2.id === id);
      if (tile) parts.push(tile.name);
    }
    return parts.length > 0 ? parts.join(", ") : t("trade.nothing");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-view-modal-title"
        ref={cardRef}
        tabIndex={-1}
      >
        <h2 id="trade-view-modal-title" className="brand-title modal-title">
          {t("trade.viewTitle")}
        </h2>
        <div className="trade-columns">
          <div className="trade-column">
            <h3 className="section-label">{nameOf(trade.fromPlayerId)}</h3>
            <p className="trade-card__line">{describeAssets(trade.give)}</p>
          </div>
          <div className="trade-column">
            <h3 className="section-label">{nameOf(trade.toPlayerId)}</h3>
            <p className="trade-card__line">{describeAssets(trade.receive)}</p>
          </div>
        </div>
        {trade.specialConditions && <p className="trade-card__conditions">"{trade.specialConditions}"</p>}
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("trade.cancelForm")}
          </button>
        </div>
      </div>
    </div>
  );
}
