import type { Player, PlayerSessionId } from "@morichup/shared";
import { t } from "../i18n";

interface HudProps {
  players: Player[];
  currentTurnPlayerId?: PlayerSessionId | null;
}

function statusLabel(player: Player): string | null {
  if (player.status === "bankrupt") return "💀";
  if (player.status === "afk") return "😴";
  if (player.status === "disconnected") return "📡";
  if (player.inJail) return "🔒";
  return null;
}

export default function Hud({ players, currentTurnPlayerId }: HudProps) {
  return (
    <aside className="hud">
      <h2 className="hud__title">{t("hud.players")}</h2>
      <ul className="hud__player-list">
        {players.map((player) => {
          const isCurrent = player.sessionId === currentTurnPlayerId;
          const status = statusLabel(player);
          return (
            <li
              key={player.sessionId}
              className={`hud__player${isCurrent ? " hud__player--current" : ""}${player.status === "bankrupt" ? " hud__player--bankrupt" : ""}`}
            >
              <span className="hud__player-color" style={{ backgroundColor: player.color }} />
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
