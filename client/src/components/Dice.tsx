import { useEffect, useRef, useState } from "react";
import type { DiceRoll } from "../state/useGameConnection";
import { t } from "../i18n";

interface DiceProps {
  roll: DiceRoll | null;
}

/** Glifi Unicode dei dadi (U+2680-U+2685): niente asset da caricare, scalano col font. */
const DIE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const TUMBLE_MS = 650;
const TUMBLE_STEP_MS = 80;

function randomFace(): number {
  return 1 + Math.floor(Math.random() * 6);
}

/**
 * Mostra l'ultimo tiro di dadi ricevuto dal server. Il server ha già deciso
 * il risultato: qui animiamo solo la rivelazione (tumble breve, poi i valori
 * reali), non generiamo mai un valore lato client.
 */
export default function Dice({ roll }: DiceProps) {
  const [displayValues, setDisplayValues] = useState<[number, number]>([1, 1]);
  const [phase, setPhase] = useState<"idle" | "rolling" | "settled">("idle");
  const lastNonce = useRef<number | null>(null);

  useEffect(() => {
    if (!roll || roll.nonce === lastNonce.current) return;
    lastNonce.current = roll.nonce;
    setPhase("rolling");

    const interval = setInterval(() => {
      setDisplayValues([randomFace(), randomFace()]);
    }, TUMBLE_STEP_MS);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValues(roll.values);
      setPhase("settled");
    }, TUMBLE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [roll]);

  if (!roll) return null;

  return (
    <div className={`dice-pair${phase === "rolling" ? " dice-pair--rolling" : ""}`}>
      <span className="die" aria-hidden="true">
        {DIE_FACES[displayValues[0]]}
      </span>
      <span className="die" aria-hidden="true">
        {DIE_FACES[displayValues[1]]}
      </span>
      {phase === "settled" && roll.isDouble && <span className="dice-pair__double">✨ {t("game.doubles")}</span>}
    </div>
  );
}
