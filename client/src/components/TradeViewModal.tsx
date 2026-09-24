import { useEffect, useRef } from "react";
import type { GameState, TradeAssets, TradeOffer } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
import { flagFor } from "../lib/flags";
import { CountryFlag } from "./flags";
import { AirportIcon, ElectricIcon, WaterIcon } from "./icons";

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

  // Prima era un semplice testo "$100, Berlin, Munich": non si capiva a colpo
  // d'occhio il prezzo o il paese di ogni proprietà coinvolta (richiesto
  // esplicitamente) — stesse righe bandiera+nome+prezzo usate nel form di
  // proposta (property-bar), qui in sola lettura.
  function renderAssets(assets: TradeAssets) {
    if (assets.cash <= 0 && assets.propertyIds.length === 0) {
      return <p className="trade-card__line">{t("trade.nothing")}</p>;
    }
    return (
      <div className="trade-view__assets">
        {assets.cash > 0 && <p className="trade-card__line trade-view__cash">${assets.cash}</p>}
        {assets.propertyIds.map((id) => {
          const tile = gameState.board.tiles.find((t2) => t2.id === id);
          if (!tile) return null;
          const flag = flagFor(tile.name);
          const symbol = flag ? (
            <CountryFlag code={flag} className="property-bar__flag" />
          ) : tile.type === "railroad" ? (
            <AirportIcon className="property-bar__symbol" />
          ) : tile.type === "utility" ? (
            /water/i.test(tile.name) ? (
              <WaterIcon className="property-bar__symbol" />
            ) : (
              <ElectricIcon className="property-bar__symbol" />
            )
          ) : null;
          return (
            <div
              key={id}
              className="property-bar property-bar--readonly"
              style={tile.groupColor ? ({ "--tile-group-color": tile.groupColor } as React.CSSProperties) : undefined}
            >
              {symbol}
              <span className="property-bar__name">{tile.name}</span>
              {tile.purchasePrice !== undefined && <span className="property-bar__price">${tile.purchasePrice}</span>}
            </div>
          );
        })}
      </div>
    );
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
            {renderAssets(trade.give)}
          </div>
          <div className="trade-column">
            <h3 className="section-label">{nameOf(trade.toPlayerId)}</h3>
            {renderAssets(trade.receive)}
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
