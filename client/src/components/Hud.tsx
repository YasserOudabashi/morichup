import type { Player } from "@morichup/shared";
import { t } from "../i18n";

interface HudProps {
  players: Player[];
}

export default function Hud({ players }: HudProps) {
  return (
    <aside className="hud">
      <h2 className="hud__title">{t("hud.players")}</h2>
      <ul className="hud__player-list">
        {players.map((player) => (
          <li key={player.sessionId} className="hud__player">
            <span className="hud__player-color" style={{ backgroundColor: player.color }} />
            <span className="hud__player-name">{player.nickname}</span>
            <span className="hud__player-money">${player.money}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
