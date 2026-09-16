import { useState } from "react";
import { t } from "../i18n";

interface MainMenuProps {
  onCreate: (password?: string) => void;
  onJoin: (code: string, password?: string) => void;
}

type Mode = "menu" | "joining" | "creating";

export default function MainMenu({ onCreate, onJoin }: MainMenuProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [code, setCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) onJoin(trimmed, joinPassword.trim() || undefined);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate(createPassword.trim() || undefined);
  }

  return (
    <div className="screen-center">
      <div className="card card--narrow">
        <h1 className="brand-title">{t("app.title")}</h1>

        {mode === "menu" && (
          <div className="menu-options">
            <button type="button" className="menu-option" onClick={() => setMode("creating")}>
              <span className="menu-option__title">{t("menu.createGame")}</span>
              <span className="menu-option__hint">{t("menu.createGameHint")}</span>
            </button>
            <button type="button" className="menu-option" onClick={() => setMode("joining")}>
              <span className="menu-option__title">{t("menu.joinGame")}</span>
              <span className="menu-option__hint">{t("menu.joinGameHint")}</span>
            </button>
          </div>
        )}

        {mode === "creating" && (
          <form onSubmit={handleCreateSubmit} className="stack">
            <label className="field-label" htmlFor="create-password">
              {t("menu.passwordOptionalLabel")}
            </label>
            <input
              id="create-password"
              type="password"
              className="text-input"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              placeholder={t("menu.passwordPlaceholder")}
              maxLength={100}
              autoFocus
            />
            <div className="button-row">
              <button type="button" className="btn btn--ghost" onClick={() => setMode("menu")}>
                {t("menu.back")}
              </button>
              <button type="submit" className="btn btn--primary">
                {t("menu.createGame")}
              </button>
            </div>
          </form>
        )}

        {mode === "joining" && (
          <form onSubmit={handleJoinSubmit} className="stack">
            <input
              className="text-input text-input--code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("menu.roomCodePlaceholder")}
              maxLength={10}
              autoFocus
            />
            <label className="field-label" htmlFor="join-password">
              {t("menu.passwordOptionalLabel")}
            </label>
            <input
              id="join-password"
              type="password"
              className="text-input"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder={t("menu.passwordPlaceholder")}
              maxLength={100}
            />
            <div className="button-row">
              <button type="button" className="btn btn--ghost" onClick={() => setMode("menu")}>
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
