import { useState } from "react";
import type { ClientIntent, GameState, PlayerSessionId, ServerEvent } from "@morichup/shared";
import Board from "./Board";
import Hud from "./Hud";
import ActionPanel from "./ActionPanel";
import TurnTimerBar from "./TurnTimerBar";
import EventLog from "./EventLog";
import SocialPanel from "./SocialPanel";
import LanguageSwitcher from "./LanguageSwitcher";
import { t } from "../i18n";

interface GameScreenProps {
  gameState: GameState;
  sessionId: PlayerSessionId;
  turnDeadline: number | null;
  events: ServerEvent[];
  onIntent: (intent: ClientIntent) => void;
  onLeave: () => void;
}

export default function GameScreen({ gameState, sessionId, turnDeadline, events, onIntent, onLeave }: GameScreenProps) {
  const winner = gameState.state === "GAME_OVER" ? gameState.players.find((p) => p.sessionId === gameState.winnerId) : null;
  const [hoveredPlayerId, setHoveredPlayerId] = useState<PlayerSessionId | null>(null);

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <span className="app-topbar__title">{t("app.title")}</span>
        <TurnTimerBar deadline={turnDeadline} />
        <div className="app-topbar__actions">
          <LanguageSwitcher variant="inline" />
          <button type="button" className="btn btn--ghost btn--small" onClick={onLeave}>
            {t("game.leaveGame")}
          </button>
        </div>
      </header>
      <div className="app-main">
        <Hud
          players={gameState.players}
          currentTurnPlayerId={gameState.currentTurnPlayerId}
          onHoverPlayer={setHoveredPlayerId}
          jackpotAmount={gameState.board.rules.freeParkingJackpot ? gameState.jackpotAmount : null}
        />
        <div className="app-board-area">
          <Board board={gameState.board} players={gameState.players} hoveredPlayerId={hoveredPlayerId} />
        </div>
        <aside className="game-side-panel">
          <ActionPanel gameState={gameState} sessionId={sessionId} onIntent={onIntent} />
          <SocialPanel gameState={gameState} sessionId={sessionId} onIntent={onIntent} />
          <EventLog events={events} board={gameState.board} players={gameState.players} accusations={gameState.accusations} />
        </aside>
      </div>
      <div className="desktop-only-notice">{t("app.desktopOnly")}</div>

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
            <button type="button" className="btn btn--primary" onClick={onLeave}>
              {t("game.leaveGame")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
