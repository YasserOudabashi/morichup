import type { Player, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";

interface HudProps {
  players: Player[];
  currentTurnPlayerId?: PlayerSessionId | null;
  onHoverPlayer?: (playerId: PlayerSessionId | null) => void;
  /** null = regola del jackpot non attiva in questa partita: niente da mostrare (Fase 7, US-703). */
  jackpotAmount?: number | null;
}

function statusLabel(player: Player): string | null {
  if (player.status === "bankrupt") return "💀";
  if (player.status === "afk") return "😴";
  if (player.status === "disconnected") return "📡";
  if (player.inJail) return "🔒";
  return null;
}

export default function Hud({ players, currentTurnPlayerId, onHoverPlayer, jackpotAmount }: HudProps) {
  return (
    <aside className="hud">
      <h2 className="hud__title">{t("hud.players")}</h2>
      {jackpotAmount != null && (
        <p className="hud__jackpot">
          🅿️ {t("hud.jackpot")}: <strong>${jackpotAmount}</strong>
        </p>
      )}
      <ul className="hud__player-list">
        {players.map((player) => {
          const isCurrent = player.sessionId === currentTurnPlayerId;
          const status = statusLabel(player);
          return (
            <li
              key={player.sessionId}
              className={`hud__player${isCurrent ? " hud__player--current" : ""}${player.status === "bankrupt" ? " hud__player--bankrupt" : ""}`}
              onMouseEnter={() => onHoverPlayer?.(player.sessionId)}
              onMouseLeave={() => onHoverPlayer?.(null)}
            >
              <span className="hud__player-color" style={{ backgroundColor: player.color }} />
              {isCurrent && (
                <span className="hud__player-turn-indicator" aria-hidden="true">
                  ▶
                </span>
              )}
              <span className="hud__player-name">{player.nickname}</span>
              {status && <span className="hud__player-status">{status}</span>}
              <span className="hud__player-money">${player.money}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
