import { classicBoard } from "@morichup/shared";
import Board from "./components/Board";
import Hud from "./components/Hud";
import { mockPlayers } from "./data/mockPlayers";
import { t } from "./i18n";

export default function App() {
  return (
    <div className="app-layout">
      <header className="app-topbar">
        <span className="app-topbar__title">{t("app.title")}</span>
        <span className="app-topbar__notice">{t("app.scaffoldNotice")}</span>
      </header>
      <div className="app-main">
        <Hud players={mockPlayers} />
        <div className="app-board-area">
          <Board board={classicBoard} players={mockPlayers} />
        </div>
      </div>
      <div className="desktop-only-notice">{t("app.desktopOnly")}</div>
    </div>
  );
}
