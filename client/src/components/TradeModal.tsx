import { useEffect, useRef, useState } from "react";
import type { GameState, PlayerSessionId, TradeAssets, TradeOffer } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";

interface TradeModalProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  /** Se presente, il form si apre pre-compilato per rispondere con una controfferta. */
  existingTrade?: TradeOffer;
  presetTargetId?: PlayerSessionId;
  onSubmit: (payload: { toPlayerId: PlayerSessionId; give: TradeAssets; receive: TradeAssets; specialConditions: string }) => void;
  onClose: () => void;
}

export default function TradeModal({ gameState, sessionId, existingTrade, presetTargetId, onSubmit, onClose }: TradeModalProps) {
  const me = gameState.players.find((p) => p.sessionId === sessionId);
  const otherPlayers = gameState.players.filter((p) => p.sessionId !== sessionId && p.status === "active");
  const isCounter = Boolean(existingTrade);

  const [targetId, setTargetId] = useState(
    existingTrade?.fromPlayerId ?? presetTargetId ?? otherPlayers[0]?.sessionId ?? ""
  );
  const target = gameState.players.find((p) => p.sessionId === targetId);

  const [giveCash, setGiveCash] = useState(existingTrade?.give.cash ?? 0);
  const [giveProps, setGiveProps] = useState<string[]>(existingTrade?.give.propertyIds ?? []);
  const [receiveCash, setReceiveCash] = useState(existingTrade?.receive.cash ?? 0);
  const [receiveProps, setReceiveProps] = useState<string[]>(existingTrade?.receive.propertyIds ?? []);
  const [specialConditions, setSpecialConditions] = useState(existingTrade?.specialConditions ?? "");

  useEscapeToClose(onClose);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  if (!me) return null;

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    onSubmit({
      toPlayerId: target.sessionId,
      give: { cash: giveCash, propertyIds: giveProps },
      receive: { cash: receiveCash, propertyIds: receiveProps },
      specialConditions,
    });
  }

  const myProperties = gameState.board.tiles.filter((tile) => me.properties.includes(tile.id));
  const targetProperties = target ? gameState.board.tiles.filter((tile) => target.properties.includes(tile.id)) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trade-modal-title"
        ref={cardRef}
        tabIndex={-1}
      >
        <h2 id="trade-modal-title" className="brand-title modal-title">
          {isCounter ? t("trade.counterTitle") : t("trade.title")}
        </h2>
        <form onSubmit={handleSubmit} className="stack">
          {!isCounter && (
            <>
              <label className="field-label" htmlFor="trade-target">
                {t("trade.selectPlayer")}
              </label>
              <select
                id="trade-target"
                className="text-input"
                value={targetId}
                onChange={(e) => {
                  setTargetId(e.target.value);
                  setReceiveProps([]);
                }}
              >
                {otherPlayers.map((p) => (
                  <option key={p.sessionId} value={p.sessionId}>
                    {p.nickname}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="trade-columns">
            <div className="trade-column">
              <h3 className="section-label">{t("trade.youGive")}</h3>
              <label className="field-label">{t("trade.cash")}</label>
              <input
                type="number"
                min={0}
                max={me.money}
                className="text-input"
                value={giveCash}
                onChange={(e) => setGiveCash(Math.max(0, Number(e.target.value)))}
              />
              <span className="field-label">{t("trade.properties")}</span>
              <div className="trade-property-list">
                {myProperties.length === 0 && <p className="waiting-notice">{t("trade.noProperties")}</p>}
                {myProperties.map((tile) => (
                  <label key={tile.id} className="trade-property-item">
                    <input
                      type="checkbox"
                      checked={giveProps.includes(tile.id)}
                      onChange={() => toggle(giveProps, setGiveProps, tile.id)}
                    />
                    {tile.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="trade-column">
              <h3 className="section-label">{t("trade.youReceive")}</h3>
              <label className="field-label">{t("trade.cash")}</label>
              <input
                type="number"
                min={0}
                max={target?.money ?? 0}
                className="text-input"
                value={receiveCash}
                onChange={(e) => setReceiveCash(Math.max(0, Number(e.target.value)))}
              />
              <span className="field-label">{t("trade.properties")}</span>
              <div className="trade-property-list">
                {targetProperties.length === 0 && <p className="waiting-notice">{t("trade.noProperties")}</p>}
                {targetProperties.map((tile) => (
                  <label key={tile.id} className="trade-property-item">
                    <input
                      type="checkbox"
                      checked={receiveProps.includes(tile.id)}
                      onChange={() => toggle(receiveProps, setReceiveProps, tile.id)}
                    />
                    {tile.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label className="field-label">{t("trade.specialConditions")}</label>
          <textarea
            className="text-input trade-textarea"
            value={specialConditions}
            onChange={(e) => setSpecialConditions(e.target.value)}
            placeholder={t("trade.specialConditionsPlaceholder")}
            maxLength={280}
          />

          <div className="button-row">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t("trade.cancelForm")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={!target}>
              {isCounter ? t("trade.sendCounter") : t("trade.send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
