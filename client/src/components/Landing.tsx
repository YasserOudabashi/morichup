import { useState } from "react";
import { t } from "../i18n";
import { getSavedNickname, saveNickname } from "../lib/session";

interface LandingProps {
  joinCode: string | null;
  reconnecting: boolean;
  onSubmit: (nickname: string) => void;
}

export default function Landing({ joinCode, reconnecting, onSubmit }: LandingProps) {
  const [nickname, setNickname] = useState(getSavedNickname());

  if (reconnecting) {
    return (
      <div className="screen-center">
        <div className="card card--narrow card--center">
          <p className="reconnect-notice">{t("landing.reconnecting")}</p>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;
    saveNickname(trimmed);
    onSubmit(trimmed);
  }

  return (
    <div className="screen-center">
      <div className="card card--narrow">
        <h1 className="brand-title">{t("app.title")}</h1>
        <p className="brand-tagline">{t("app.tagline")}</p>
        {joinCode && (
          <p className="join-notice">
            {t("landing.joiningRoom")} <strong>{joinCode}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit} className="stack">
          <label className="field-label" htmlFor="nickname">
            {t("landing.nicknameLabel")}
          </label>
          <input
            id="nickname"
            className="text-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("landing.nicknamePlaceholder")}
            maxLength={20}
            autoFocus
          />
          <button type="submit" className="btn btn--primary" disabled={!nickname.trim()}>
            {t("landing.continue")}
          </button>
        </form>
      </div>
    </div>
  );
}
