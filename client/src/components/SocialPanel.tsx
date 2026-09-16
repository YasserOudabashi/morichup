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
  const [auctionFormTileId, setAuctionFormTileId] = useState<string | null>(null);
  const [minBid, setMinBid] = useState(0);

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

  const me = gameState.players.find((p) => p.sessionId === sessionId);
  const canStartAuction = me?.status === "active" && gameState.auction === null && gameState.state !== "GAME_OVER";
  const myTiles = (me?.properties ?? [])
    .map((id) => gameState.board.tiles.find((tile) => tile.id === id))
    .filter((tile): tile is NonNullable<typeof tile> => Boolean(tile));

  const isMyTurn = gameState.currentTurnPlayerId === sessionId;
  const hasPendingDebt = (me?.pendingDebts.length ?? 0) > 0;
  const mortgageEnabled = gameState.board.rules.mortgageEnabled ?? false;

  function buildingLevel(tile: (typeof myTiles)[number]): number {
    return tile.hotel ? 5 : (tile.houses ?? 0);
  }

  function ownsFullGroup(tile: (typeof myTiles)[number]): boolean {
    if (!tile.group) return false;
    return gameState.board.tiles
      .filter((t) => t.type === "property" && t.group === tile.group)
      .every((t) => t.ownerId === sessionId);
  }

  function confirmStartAuction(tileId: string) {
    onIntent({ type: "START_PLAYER_AUCTION", tileId, minimumBid: Math.max(0, minBid) });
    setAuctionFormTileId(null);
    setMinBid(0);
  }

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

      <h3 className="section-label social-panel__section">{t("myProperties.title")}</h3>
      {myTiles.length === 0 && <p className="waiting-notice">{t("myProperties.none")}</p>}
      {myTiles.map((tile) => {
        const level = buildingLevel(tile);
        const canBuild = tile.type === "property" && ownsFullGroup(tile) && level < 5 && isMyTurn;
        const canSell = tile.type === "property" && level > 0 && (isMyTurn || hasPendingDebt);
        const nextCost = level === 4 ? tile.hotelCost : tile.houseCost;
        const sellRefund = Math.floor((level === 5 ? (tile.hotelCost ?? 0) : (tile.houseCost ?? 0)) / 2);
        // Fase 7, US-701/702: attivare l'ipoteca resta un'azione del proprio turno (come costruire);
        // riscattarla è sempre permessa, anche fuori turno, per liberarsi rapidamente dal vincolo.
        const canMortgage = mortgageEnabled && !tile.mortgaged && level === 0 && isMyTurn;
        const canUnmortgage = mortgageEnabled && tile.mortgaged === true;
        const mortgageAmount = Math.floor((tile.purchasePrice ?? 0) / 2);
        const unmortgageAmount =
          mortgageAmount + Math.ceil(mortgageAmount * (gameState.board.rules.mortgageInterestRate ?? 0.1));
        return (
        <div key={tile.id} className="my-property-row">
          <span className="my-property-row__name">
            {tile.name}
            {level > 0 && <span className="my-property-row__buildings"> {level === 5 ? "🏨" : "🏠".repeat(level)}</span>}
            {tile.mortgaged && <span className="my-property-row__mortgaged"> ({t("mortgage.mortgagedTag")})</span>}
          </span>
          {(canMortgage || canUnmortgage) && (
            <div className="my-property-row__building-actions">
              {canMortgage && (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onIntent({ type: "MORTGAGE_PROPERTY", tileId: tile.id })}
                >
                  {t("mortgage.mortgage", { amount: mortgageAmount })}
                </button>
              )}
              {canUnmortgage && (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onIntent({ type: "UNMORTGAGE_PROPERTY", tileId: tile.id })}
                >
                  {t("mortgage.unmortgage", { amount: unmortgageAmount })}
                </button>
              )}
            </div>
          )}
          {(canBuild || canSell) && (
            <div className="my-property-row__building-actions">
              {canBuild && (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onIntent({ type: "BUILD_HOUSE", tileId: tile.id })}
                >
                  {level === 4 ? t("building.buildHotel", { cost: nextCost ?? 0 }) : t("building.buildHouse", { cost: nextCost ?? 0 })}
                </button>
              )}
              {canSell && (
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onIntent({ type: "SELL_HOUSE", tileId: tile.id })}
                >
                  {t("building.sell", { amount: sellRefund })}
                </button>
              )}
            </div>
          )}
          {canStartAuction &&
            !tile.mortgaged &&
            (auctionFormTileId === tile.id ? (
              <div className="my-property-row__form">
                <input
                  type="number"
                  className="text-input text-input--small"
                  min={0}
                  value={minBid}
                  onChange={(e) => setMinBid(Number(e.target.value))}
                  placeholder={t("startAuction.minimumBidLabel")}
                />
                <button type="button" className="btn btn--primary btn--small" onClick={() => confirmStartAuction(tile.id)}>
                  {t("startAuction.confirm")}
                </button>
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setAuctionFormTileId(null)}>
                  {t("startAuction.cancel")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => {
                  setAuctionFormTileId(tile.id);
                  setMinBid(0);
                }}
              >
                {t("startAuction.button")}
              </button>
            ))}
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
