const MUTE_KEY = "morichup.soundMuted";

export type SoundKind = "dice" | "purchase" | "rent" | "turnStart" | "bankrupt";

/** Toni sintetizzati via Web Audio: nessun file audio da scaricare, coerente
 * con "nessuna libreria esterna pesante" (PRD Fase 10, US-1003). */
const TONES: Record<SoundKind, { freq: number; duration: number; type: OscillatorType }> = {
  dice: { freq: 440, duration: 0.08, type: "square" },
  purchase: { freq: 660, duration: 0.15, type: "sine" },
  rent: { freq: 220, duration: 0.15, type: "sawtooth" },
  turnStart: { freq: 880, duration: 0.12, type: "sine" },
  bankrupt: { freq: 150, duration: 0.4, type: "sawtooth" },
};

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // localStorage non disponibile: la preferenza resta solo per questa sessione.
  }
}

export function playSound(kind: SoundKind): void {
  if (isSoundMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  const { freq, duration, type } = TONES[kind];
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}
