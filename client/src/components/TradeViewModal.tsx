import { useEffect, useRef } from "react";
import type { GameState, TradeAssets, TradeOffer } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";

interface TradeViewModalProps {
  gameState: GameState;
  trade: TradeOffer;
  onClose: () => void;
  /** Presenti solo quando lo scambio è realmente rivolto a te e in attesa di
   * risposta: trasformano la vista di sola lettura (per scambi altrui, o per
   * il click da cronologia) in un pop-up d'offerta con pulsanti d'azione. */
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
}

/** Vista di uno scambio: di sola lettura per scambi tra ALTRI giocatori o
 * quando aperta dalla cronologia, con pulsanti di risposta quando invece è
 * un'offerta in arrivo rivolta a te (vedi onAccept/onReject/onCounter). */
export default function TradeViewModal({ gameState, trade, onClose, onAccept, onReject, onCounter }: TradeViewModalProps) {
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

  const isIncomingOffer = Boolean(onAccept || onReject || onCounter);

  return (
    <div className={`modal-overlay${isIncomingOffer ? " modal-overlay--offer" : ""}`} onClick={onClose}>
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
          {isIncomingOffer ? t("trade.incomingOfferTitle") : t("trade.viewTitle")}
        </h2>
        {isIncomingOffer && (
          <p className="trade-card__parties">{t("trade.between", { from: nameOf(trade.fromPlayerId), to: nameOf(trade.toPlayerId) })}</p>
        )}
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
        {isIncomingOffer && (
          <div className="button-row">
            {onReject && (
              <button type="button" className="btn btn--ghost" onClick={onReject}>
                {t("trade.reject")}
              </button>
            )}
            {onCounter && (
              <button type="button" className="btn btn--ghost" onClick={onCounter}>
                {t("trade.counter")}
              </button>
            )}
            {onAccept && (
              <button type="button" className="btn btn--primary" onClick={onAccept}>
                {t("trade.accept")}
              </button>
            )}
          </div>
        )}
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("trade.cancelForm")}
          </button>
        </div>
      </div>
    </div>
  );
}
