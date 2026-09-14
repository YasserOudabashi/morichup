import type { ClientIntent, GameState, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";

interface ActionPanelProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  onIntent: (intent: ClientIntent) => void;
}

export default function ActionPanel({ gameState, sessionId, onIntent }: ActionPanelProps) {
  const player = gameState.players.find((p) => p.sessionId === sessionId);
  const isMyTurn = gameState.currentTurnPlayerId === sessionId;

  if (gameState.state === "GAME_OVER" || !player) return null;

  if (!isMyTurn) {
    const current = gameState.players.find((p) => p.sessionId === gameState.currentTurnPlayerId);
    return (
      <div className="action-panel">
        <p className="action-panel__waiting">
          {t("game.waitingFor")} {current?.nickname ?? "…"}
        </p>
      </div>
    );
  }

  if (gameState.pendingDecision?.type === "buyOrDecline") {
    const tile = gameState.board.tiles.find((t2) => t2.id === gameState.pendingDecision!.tileId);
    return (
      <div className="action-panel">
        {tile && (
          <div className="property-offer" style={{ borderColor: tile.groupColor ?? "var(--color-border)" }}>
            <span className="property-offer__name">{tile.name}</span>
            <span className="property-offer__price">${tile.purchasePrice}</span>
          </div>
        )}
        <div className="button-row">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onIntent({ type: "DECLINE_PROPERTY", tileId: gameState.pendingDecision!.tileId })}
          >
            {t("game.decline")}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onIntent({ type: "BUY_PROPERTY", tileId: gameState.pendingDecision!.tileId })}
          >
            {t("game.buyProperty")}
          </button>
        </div>
      </div>
    );
  }

  if (gameState.state === "ROLLING") {
    if (player.inJail) {
      return (
        <div className="action-panel">
          <p className="action-panel__waiting">{t("game.inJail")}</p>
          <div className="button-row">
            {player.getOutOfJailFreeCards > 0 && (
              <button type="button" className="btn btn--ghost" onClick={() => onIntent({ type: "USE_JAIL_CARD" })}>
                {t("game.useJailCard")}
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => onIntent({ type: "PAY_BAIL" })}>
              {t("game.payBail")}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => onIntent({ type: "ROLL_DICE" })}>
              {t("game.rollDice")}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="action-panel">
        <button type="button" className="btn btn--primary btn--large" onClick={() => onIntent({ type: "ROLL_DICE" })}>
          🎲 {t("game.rollDice")}
        </button>
      </div>
    );
  }

  if (gameState.state === "PLAYER_DECISION") {
    return (
      <div className="action-panel">
        <button type="button" className="btn btn--primary" onClick={() => onIntent({ type: "END_TURN" })}>
          {t("game.endTurn")}
        </button>
      </div>
    );
  }

  return null;
}
