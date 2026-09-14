import { useEffect, useState } from "react";
import { t } from "../i18n";

interface TurnTimerBarProps {
  deadline: number | null;
}

export default function TurnTimerBar({ deadline }: TurnTimerBarProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) return null;

  const totalMs = Math.max(0, deadline - now);
  const seconds = Math.ceil(totalMs / 1000);
  const urgent = seconds <= 5;

  return (
    <div className="turn-timer">
      <span className="turn-timer__label">{t("game.timeLeft")}</span>
      <span className={`turn-timer__seconds${urgent ? " turn-timer__seconds--urgent" : ""}`}>{seconds}s</span>
    </div>
  );
}
