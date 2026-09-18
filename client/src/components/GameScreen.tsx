import { useState } from "react";
import type { ChatMessage, ClientIntent, GameState, PlayerSessionId, ServerEvent } from "@morichup/shared";
import type { DiceRoll, MoveBatch } from "../state/useGameConnection";
import Board from "./Board";
import Hud from "./Hud";
import ActionPanel from "./ActionPanel";
import TurnTimerBar from "./TurnTimerBar";
import EventLog from "./EventLog";
import SocialPanel from "./SocialPanel";
import ChatPanel from "./ChatPanel";
import LanguageSwitcher from "./LanguageSwitcher";
import SoundToggle from "./SoundToggle";
import NotificationToggle from "./NotificationToggle";
import { useTurnNotification } from "../hooks/useTurnNotification";
import { t } from "../i18n";

interface GameScreenProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  turnDeadline: number | null;
  events: ServerEvent[];
  diceRoll: DiceRoll | null;
  moveBatch: MoveBatch | null;
  onIntent: (intent: ClientIntent) => void;
  onLeave: () => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
  onRematch: () => void;
  isHost: boolean;
}

export default function GameScreen({
  gameState,
  sessionId,
  turnDeadline,
  events,
  diceRoll,
  moveBatch,
  onIntent,
  onLeave,
  chatMessages,
  onSendChatMessage,
  onRematch,
  isHost,
}: GameScreenProps) {
  const winner = gameState.state === "GAME_OVER" ? gameState.players.find((p) => p.sessionId === gameState.winnerId) : null;
  const [hoveredPlayerId, setHoveredPlayerId] = useState<PlayerSessionId | null>(null);
  const [mobileTab, setMobileTab] = useState<"board" | "players" | "actions">("board");
  const me = gameState.players.find((p) => p.sessionId === sessionId);
  const isSpectator = me?.status === "spectator";

  useTurnNotification(gameState.currentTurnPlayerId === sessionId && !isSpectator);

  // Touch non ha hover: un tap esplicito su un giocatore attiva/disattiva
  // l'evidenziazione delle sue proprietà (US-1001), senza toccare il
  // comportamento hover già esistente su desktop.
  function handleTapPlayer(playerId: PlayerSessionId) {
    setHoveredPlayerId((prev) => (prev === playerId ? null : playerId));
  }

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <span className="app-topbar__title">{t("app.title")}</span>
        <TurnTimerBar deadline={turnDeadline} />
        <div className="app-topbar__actions">
          <SoundToggle />
          <NotificationToggle />
          <LanguageSwitcher variant="inline" />
          <button type="button" className="btn btn--ghost btn--small" onClick={onLeave}>
            {t("game.leaveGame")}
          </button>
        </div>
      </header>
      <nav className="mobile-tabs">
        <button
          type="button"
          className={`mobile-tabs__item${mobileTab === "board" ? " mobile-tabs__item--active" : ""}`}
          onClick={() => setMobileTab("board")}
        >
          {t("mobile.tabBoard")}
        </button>
        <button
          type="button"
          className={`mobile-tabs__item${mobileTab === "players" ? " mobile-tabs__item--active" : ""}`}
          onClick={() => setMobileTab("players")}
        >
          {t("mobile.tabPlayers")}
        </button>
        <button
          type="button"
          className={`mobile-tabs__item${mobileTab === "actions" ? " mobile-tabs__item--active" : ""}`}
          onClick={() => setMobileTab("actions")}
        >
          {t("mobile.tabActions")}
        </button>
      </nav>
      <div className="app-main">
        <div className={`app-main__hud${mobileTab === "players" ? " app-main__hud--active" : ""}`}>
          <Hud
            players={gameState.players}
            currentTurnPlayerId={gameState.currentTurnPlayerId}
            onHoverPlayer={setHoveredPlayerId}
            onTapPlayer={handleTapPlayer}
            jackpotAmount={gameState.board.rules.freeParkingJackpot ? gameState.jackpotAmount : null}
          />
        </div>
        <div className={`app-board-area${mobileTab === "board" ? " app-board-area--active" : ""}`}>
          <Board
            board={gameState.board}
            players={gameState.players}
            hoveredPlayerId={hoveredPlayerId}
            diceRoll={diceRoll}
            moveBatch={moveBatch}
            gameState={gameState}
            sessionId={sessionId}
            onIntent={onIntent}
            events={events}
          />
        </div>
        <aside className={`game-side-panel${mobileTab === "actions" ? " game-side-panel--active" : ""}`}>
          {isSpectator ? (
            <div className="action-panel">
              <p className="action-panel__waiting">{t("game.spectatorNotice")}</p>
            </div>
          ) : (
            <ActionPanel gameState={gameState} sessionId={sessionId} onIntent={onIntent} />
          )}
          <SocialPanel gameState={gameState} sessionId={sessionId} onIntent={onIntent} />
          <EventLog events={events} board={gameState.board} players={gameState.players} accusations={gameState.accusations} />
          <ChatPanel messages={chatMessages} sessionId={sessionId} onSend={onSendChatMessage} />
        </aside>
      </div>

      {winner && (
        <div className="game-over-overlay">
          <div className="card card--narrow card--center">
            <h2>{t("game.gameOver")}</h2>
            <p className="game-over-winner">
              {winner.nickname} {t("game.winner")}
            </p>
            {gameState.winReason && gameState.winReason !== "lastStanding" && (
              <p className="game-over-reason">
                {t(gameState.winReason === "turnLimit" ? "game.winByTurnLimit" : "game.winByTimeLimit")}
              </p>
            )}
            <div className="button-row">
              {isHost && (
                <button type="button" className="btn btn--primary" onClick={onRematch}>
                  {t("game.rematch")}
                </button>
              )}
              <button type="button" className="btn btn--ghost" onClick={onLeave}>
                {t("game.leaveGame")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
