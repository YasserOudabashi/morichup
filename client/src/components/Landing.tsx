import { useState } from "react";
import { PLAYER_COLOR_PALETTE } from "@morichup/shared";
import { t } from "../i18n";
import { getSavedColor, getSavedNickname, saveColor, saveNickname } from "../lib/session";

interface LandingProps {
  joinCode: string | null;
  reconnecting: boolean;
  onSubmit: (nickname: string) => void;
}

export default function Landing({ joinCode, reconnecting, onSubmit }: LandingProps) {
  const [nickname, setNickname] = useState(getSavedNickname());
  const [color, setColor] = useState(getSavedColor() ?? PLAYER_COLOR_PALETTE[0]);

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
    saveColor(color);
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
          <span className="field-label">{t("landing.colorLabel")}</span>
          <div className="color-picker" role="radiogroup" aria-label={t("landing.colorLabel")}>
            {PLAYER_COLOR_PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                role="radio"
                aria-checked={swatch === color}
                aria-label={swatch}
                className={`color-picker__swatch${swatch === color ? " color-picker__swatch--selected" : ""}`}
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
              />
            ))}
          </div>
          <button type="submit" className="btn btn--primary" disabled={!nickname.trim()}>
            {t("landing.continue")}
          </button>
        </form>
      </div>
    </div>
  );
}
