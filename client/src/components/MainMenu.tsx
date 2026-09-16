import { useState } from "react";
import { t } from "../i18n";

interface MainMenuProps {
  onCreate: () => void;
  onJoin: (code: string) => void;
  onHistory: () => void;
}

export default function MainMenu({ onCreate, onJoin, onHistory }: MainMenuProps) {
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) onJoin(trimmed);
  }

  return (
    <div className="screen-center">
      <div className="card card--narrow">
        <h1 className="brand-title">{t("app.title")}</h1>

        {!joining ? (
          <div className="menu-options">
            <button type="button" className="menu-option" onClick={onCreate}>
              <span className="menu-option__title">{t("menu.createGame")}</span>
              <span className="menu-option__hint">{t("menu.createGameHint")}</span>
            </button>
            <button type="button" className="menu-option" onClick={() => setJoining(true)}>
              <span className="menu-option__title">{t("menu.joinGame")}</span>
              <span className="menu-option__hint">{t("menu.joinGameHint")}</span>
            </button>
            <button type="button" className="menu-option" onClick={onHistory}>
              <span className="menu-option__title">{t("menu.history")}</span>
              <span className="menu-option__hint">{t("menu.historyHint")}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoinSubmit} className="stack">
            <input
              className="text-input text-input--code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("menu.roomCodePlaceholder")}
              maxLength={10}
              autoFocus
            />
            <div className="button-row">
              <button type="button" className="btn btn--ghost" onClick={() => setJoining(false)}>
                {t("menu.back")}
              </button>
              <button type="submit" className="btn btn--primary" disabled={!code.trim()}>
                {t("menu.join")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
