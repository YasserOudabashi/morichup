import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";
import Board from "./Board";
import EventLog from "./EventLog";
import type { MatchHistoryEntry } from "../lib/matchHistory";

interface ReplayProps {
  entry: MatchHistoryEntry;
  onExit: () => void;
}

const SPEEDS = [1, 2, 4];
const BASE_STEP_MS = 1200;

/** Fase 11, US-1102: rigioca una partita salvata usando solo i dati in
 * localStorage, senza connessione al server — ogni passo è uno snapshot di
 * GameState già ricevuto durante la partita reale. */
export default function Replay({ entry, onExit }: ReplayProps) {
  const lastIndex = entry.steps.length - 1;
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= lastIndex) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStepIndex((i) => Math.min(i + 1, lastIndex)), BASE_STEP_MS / SPEEDS[speedIndex]);
    return () => clearTimeout(timer);
  }, [playing, stepIndex, lastIndex, speedIndex]);

  const state = entry.steps[stepIndex];
  const visibleEvents = useMemo(
    () => [...entry.events.slice(0, entry.stepEventCounts[stepIndex] ?? 0)].reverse(),
    [entry, stepIndex]
  );

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <span className="app-topbar__title">
          {entry.mapName} — {t("replay.title")}
        </span>
        <div className="app-topbar__actions">
          <button type="button" className="btn btn--ghost btn--small" onClick={onExit}>
            {t("menu.back")}
          </button>
        </div>
      </header>
      <div className="app-main">
        <div className="app-board-area">
          <Board board={state.board} players={state.players} />
        </div>
        <aside className="game-side-panel">
          <div className="replay-controls">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                setPlaying(false);
                setStepIndex((i) => Math.max(0, i - 1));
              }}
              disabled={stepIndex === 0}
              aria-label={t("replay.previous")}
            >
              ⏮
            </button>
            <button
              type="button"
              className="btn btn--primary btn--small"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? t("replay.pause") : t("replay.play")}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                setPlaying(false);
                setStepIndex((i) => Math.min(lastIndex, i + 1));
              }}
              disabled={stepIndex >= lastIndex}
              aria-label={t("replay.next")}
            >
              ⏭
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setSpeedIndex((i) => (i + 1) % SPEEDS.length)}
              aria-label={t("replay.speed")}
            >
              {SPEEDS[speedIndex]}x
            </button>
            <span className="replay-controls__step">
              {stepIndex + 1} / {entry.steps.length}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={lastIndex}
            value={stepIndex}
            onChange={(e) => {
              setPlaying(false);
              setStepIndex(Number(e.target.value));
            }}
            className="replay-scrubber"
            aria-label={t("replay.scrubber")}
          />
          <EventLog events={visibleEvents} board={state.board} players={state.players} accusations={state.accusations} />
        </aside>
      </div>
    </div>
  );
}
