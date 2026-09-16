import { useState } from "react";
import { t } from "../i18n";
import { getLocale } from "../i18n";
import { clearMatchHistory, getMatchHistory, type MatchHistoryEntry } from "../lib/matchHistory";

interface MatchHistoryProps {
  onBack: () => void;
  onReplay: (entry: MatchHistoryEntry) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function MatchHistory({ onBack, onReplay }: MatchHistoryProps) {
  const [entries, setEntries] = useState(() => getMatchHistory());

  function handleClear() {
    clearMatchHistory();
    setEntries([]);
  }

  return (
    <div className="screen-center">
      <div className="card card--wide">
        <h1 className="brand-title">{t("history.title")}</h1>

        {entries.length === 0 ? (
          <p className="waiting-notice">{t("history.empty")}</p>
        ) : (
          <ul className="match-history-list">
            {entries.map((entry) => (
              <li key={entry.id} className="match-history-item">
                <div className="match-history-item__info">
                  <span className={`match-history-item__result match-history-item__result--${entry.result}`}>
                    {t(`history.result.${entry.result}`)}
                  </span>
                  <span className="match-history-item__map">{entry.mapName}</span>
                  <span className="match-history-item__meta">
                    {new Date(entry.date).toLocaleString(getLocale())} · {entry.playerCount} {t("history.players")} ·{" "}
                    {formatDuration(entry.durationMs)}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => onReplay(entry)}
                  disabled={entry.steps.length === 0}
                >
                  {t("history.replay")}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            {t("menu.back")}
          </button>
          {entries.length > 0 && (
            <button type="button" className="btn btn--ghost" onClick={handleClear}>
              {t("history.clear")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
