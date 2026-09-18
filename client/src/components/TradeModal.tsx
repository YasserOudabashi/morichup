import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { GameState, PlayerSessionId, Tile, TradeAssets, TradeOffer } from "@morichup/shared";
import { t } from "../i18n";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
import { flagFor } from "../lib/flags";
import { CountryFlag } from "./flags";

/** Barra cliccabile a tutta larghezza per scegliere una proprietà da mettere
 * in uno scambio: colorata dal gruppo come la casella sul tabellone, con la
 * sua bandiera e il prezzo — più riconoscibile di una riga di checkbox col
 * solo nome, e più in linea con com'è organizzata la lista nel riferimento
 * visivo (righe piene, non una griglia di quadrati). */
function PropertyBar({ tile, selected, onToggle }: { tile: Tile; selected: boolean; onToggle: () => void }) {
  const flag = tile.type === "property" ? flagFor(tile.name) : null;
  return (
    <button
      type="button"
      className={`property-bar${selected ? " property-bar--selected" : ""}`}
      style={tile.groupColor ? ({ "--tile-group-color": tile.groupColor } as CSSProperties) : undefined}
      onClick={onToggle}
      aria-pressed={selected}
    >
      {flag && <CountryFlag code={flag} className="property-bar__flag" />}
      <span className="property-bar__name">{tile.name}</span>
      {tile.mortgaged && <span className="property-bar__mortgaged">{t("mortgage.mortgagedTag")}</span>}
      {tile.purchasePrice !== undefined && <span className="property-bar__price">${tile.purchasePrice}</span>}
    </button>
  );
}

/** Slider per l'importo in denaro: traccia riempita fino al valore corrente
 * e una "pillola" col totale che segue il pollice, invece di uno slider
 * nativo spoglio con la cifra a fianco. */
function CashSlider({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  const clamped = Math.min(value, max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div className="cash-slider" style={{ "--fill-percent": `${percent}%` } as CSSProperties}>
      <input
        type="range"
        min={0}
        max={Math.max(0, max)}
        step={Math.max(1, Math.round(max / 100) || 1)}
        value={clamped}
        onChange={(e) => onChange(Number(e.target.value))}
        className="cash-slider__input"
        disabled={max <= 0}
      />
      <span className="cash-slider__bubble" style={{ left: `${percent}%` }}>
        ${clamped}
      </span>
      <div className="cash-slider__scale">
        <span>$0</span>
        <span>${max}</span>
      </div>
    </div>
  );
}

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
              <CashSlider value={giveCash} max={me.money} onChange={setGiveCash} />
              <span className="field-label">{t("trade.properties")}</span>
              <div className="property-bar-list">
                {myProperties.length === 0 && <p className="waiting-notice">{t("trade.noProperties")}</p>}
                {myProperties.map((tile) => (
                  <PropertyBar
                    key={tile.id}
                    tile={tile}
                    selected={giveProps.includes(tile.id)}
                    onToggle={() => toggle(giveProps, setGiveProps, tile.id)}
                  />
                ))}
              </div>
            </div>

            <span className="trade-columns__swap" aria-hidden="true">
              ↔
            </span>

            <div className="trade-column">
              <h3 className="section-label">{t("trade.youReceive")}</h3>
              <label className="field-label">{t("trade.cash")}</label>
              <CashSlider value={receiveCash} max={target?.money ?? 0} onChange={setReceiveCash} />
              <span className="field-label">{t("trade.properties")}</span>
              <div className="property-bar-list">
                {targetProperties.length === 0 && <p className="waiting-notice">{t("trade.noProperties")}</p>}
                {targetProperties.map((tile) => (
                  <PropertyBar
                    key={tile.id}
                    tile={tile}
                    selected={receiveProps.includes(tile.id)}
                    onToggle={() => toggle(receiveProps, setReceiveProps, tile.id)}
                  />
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
