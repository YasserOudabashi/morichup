/** Piccola libreria di icone SVG inline, line-art, currentColor: stesso stile
 * di CrownIcon/CornerGlyph/le icone regole di Lobby.tsx, per sostituire le
 * emoji rimaste (che stonano visivamente col resto del redesign) senza
 * introdurre asset esterni. Ogni icona è puramente decorativa: il testo
 * accessibile resta a carico del chiamante (aria-label/title già presenti). */

interface IconProps {
  className?: string;
}

export function HouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </svg>
  );
}

export function HotelIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M3 21h18" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 12h.01M15 12h.01M12 12h.01" />
    </svg>
  );
}

export function SkullIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 3a7 7 0 0 0-7 7c0 2.4 1.2 4 2.5 5.2V18h3v-2h3v2h3v-2.8c1.3-1.2 2.5-2.8 2.5-5.2a7 7 0 0 0-7-7Z" />
      <circle cx="9.3" cy="10.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SleepIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M20 15a8 8 0 1 1-9-9 6.5 6.5 0 0 0 9 9Z" />
    </svg>
  );
}

export function DisconnectedIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8.5 16.5a5 5 0 0 1 7-7" strokeDasharray="2.5 2.5" />
      <path d="M5 20 20 5" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 4v16l14-8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ParkingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 16V8h4a3 3 0 0 1 0 6H9" />
    </svg>
  );
}

export function DiceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3 3M15.4 15.4l3 3M18.4 5.6l-3 3M8.6 15.4l-3 3" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function SoundOnIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9Z" />
      <path d="M16.5 8a5 5 0 0 1 0 8M19 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function SoundOffIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9Z" />
      <path d="M16 9l5 6M21 9l-5 6" />
    </svg>
  );
}

export function BellOffIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 10a6 6 0 0 1 10.3-4.2" />
      <path d="M18 10c0 4 1.5 5.5 1.5 5.5h-11" />
      <path d="M6 10c0 1.7-.3 3-.8 4" />
      <path d="M10 19a2 2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </svg>
  );
}
