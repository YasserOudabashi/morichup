import { useState } from "react";
import type { ClientIntent, GameState, PlayerSessionId, TradeAssets } from "@morichup/shared";
import { t } from "../i18n";
import TradeModal from "./TradeModal";

interface SocialPanelProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  onIntent: (intent: ClientIntent) => void;
}

type ModalState = { mode: "propose" } | { mode: "counter"; tradeId: string };

export default function SocialPanel({ gameState, sessionId, onIntent }: SocialPanelProps) {
  const [modalState, setModalState] = useState<ModalState | null>(null);

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

  const myTrades = gameState.trades.filter((tr) => tr.fromPlayerId === sessionId || tr.toPlayerId === sessionId);
  const otherTrades = gameState.trades.filter((tr) => tr.fromPlayerId !== sessionId && tr.toPlayerId !== sessionId);
  const myContracts = gameState.contracts.filter((c) => c.participants.includes(sessionId));
  const openAccusations = gameState.accusations.filter((a) => a.status === "voting");
  const existingTradeForModal =
    modalState?.mode === "counter" ? gameState.trades.find((tr) => tr.id === modalState.tradeId) : undefined;

  return (
    <div className="social-panel">
      <div className="social-panel__header">
        <h3 className="section-label">{t("trade.activeTrades")}</h3>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setModalState({ mode: "propose" })}>
          {t("trade.propose")}
        </button>
      </div>

      {myTrades.length === 0 && otherTrades.length === 0 && <p className="waiting-notice">{t("trade.noActiveTrades")}</p>}

      {myTrades.map((trade) => {
        const isRecipient = trade.toPlayerId === sessionId;
        return (
          <div key={trade.id} className="trade-card">
            <p className="trade-card__parties">
              {t("trade.between", { from: nameOf(trade.fromPlayerId), to: nameOf(trade.toPlayerId) })}
            </p>
            <p className="trade-card__line">
              <strong>{t("trade.youGive")}:</strong> {describeAssets(trade.fromPlayerId === sessionId ? trade.give : trade.receive)}
            </p>
            <p className="trade-card__line">
              <strong>{t("trade.youReceive")}:</strong> {describeAssets(trade.fromPlayerId === sessionId ? trade.receive : trade.give)}
            </p>
            {trade.specialConditions && <p className="trade-card__conditions">"{trade.specialConditions}"</p>}
            <div className="button-row">
              {isRecipient ? (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => onIntent({ type: "REJECT_TRADE", tradeId: trade.id })}
                  >
                    {t("trade.reject")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => setModalState({ mode: "counter", tradeId: trade.id })}
                  >
                    {t("trade.counter")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--small"
                    onClick={() => onIntent({ type: "ACCEPT_TRADE", tradeId: trade.id })}
                  >
                    {t("trade.accept")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onIntent({ type: "CANCEL_TRADE", tradeId: trade.id })}
                >
                  {t("trade.withdraw")}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {otherTrades.map((trade) => (
        <p key={trade.id} className="trade-card__other">
          {t("trade.between", { from: nameOf(trade.fromPlayerId), to: nameOf(trade.toPlayerId) })}
        </p>
      ))}

      <h3 className="section-label social-panel__section">{t("contract.title")}</h3>
      {myContracts.length === 0 && <p className="waiting-notice">{t("contract.noContracts")}</p>}
      {myContracts.map((contract) => (
        <div key={contract.id} className="contract-card">
          <p className="contract-card__text">"{contract.text}"</p>
          <p className="contract-card__meta">
            {t("contract.between", { a: nameOf(contract.participants[0]), b: nameOf(contract.participants[1]) })} ·{" "}
            {contract.status === "active" ? t("contract.statusActive") : t("contract.statusDisputed")}
          </p>
          {contract.status === "active" && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => onIntent({ type: "REPORT_BROKEN_PROMISE", contractId: contract.id })}
            >
              {t("contract.reportBroken")}
            </button>
          )}
        </div>
      ))}

      {openAccusations.map((accusation) => {
        const eligible =
          sessionId !== accusation.accuserId &&
          sessionId !== accusation.accusedId &&
          gameState.players.find((p) => p.sessionId === sessionId)?.status === "active";
        const alreadyVoted = Boolean(accusation.votes[sessionId]);
        const tally = Object.values(accusation.votes).reduce(
          (acc, vote) => ({
            guilty: acc.guilty + (vote === "guilty" ? 1 : 0),
            notGuilty: acc.notGuilty + (vote === "notGuilty" ? 1 : 0),
          }),
          { guilty: 0, notGuilty: 0 }
        );
        return (
          <div key={accusation.id} className="accusation-card">
            <p className="accusation-card__title">{t("accusation.title")}</p>
            <p className="accusation-card__text">
              {t("accusation.accuses", { accuser: nameOf(accusation.accuserId), accused: nameOf(accusation.accusedId) })}
            </p>
            <p className="accusation-card__tally">{t("accusation.tally", { guilty: tally.guilty, notGuilty: tally.notGuilty })}</p>
            {eligible && !alreadyVoted && (
              <div className="button-row">
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onIntent({ type: "VOTE_ACCUSATION", accusationId: accusation.id, vote: "notGuilty" })}
                >
                  {t("accusation.voteNotGuilty")}
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--small"
                  onClick={() => onIntent({ type: "VOTE_ACCUSATION", accusationId: accusation.id, vote: "guilty" })}
                >
                  {t("accusation.voteGuilty")}
                </button>
              </div>
            )}
            {eligible && alreadyVoted && <p className="waiting-notice">{t("accusation.alreadyVoted")}</p>}
          </div>
        );
      })}

      {modalState && (
        <TradeModal
          gameState={gameState}
          sessionId={sessionId}
          existingTrade={existingTradeForModal}
          onSubmit={(payload) => {
            if (modalState.mode === "counter") {
              onIntent({
                type: "COUNTER_TRADE",
                tradeId: modalState.tradeId,
                give: payload.give,
                receive: payload.receive,
                specialConditions: payload.specialConditions,
              });
            } else {
              onIntent({
                type: "PROPOSE_TRADE",
                toPlayerId: payload.toPlayerId,
                give: payload.give,
                receive: payload.receive,
                specialConditions: payload.specialConditions,
              });
            }
            setModalState(null);
          }}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}
