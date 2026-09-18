/** Bandiere disegnate come SVG piatti (strisce/forme di base), non emoji: su
 * Linux/Chrome senza un font a colori le sequenze di bandiera emoji (🇳🇵 ecc.)
 * cadono spesso sulle due lettere del codice paese invece del disegno —
 * problema cross-browser reale (funzionava su Firefox, non su Chrome). Un
 * SVG nostro rende identico ovunque. Stile semplificato, non araldico
 * accurato al pixel, ma riconoscibile a colpo d'occhio per i paesi
 * effettivamente usati dalle mappe (vedi flags.ts per la lista città→paese). */

export type CountryCode = "NL" | "IT" | "DE" | "GB" | "GR" | "BR" | "ES" | "FR" | "JP";

interface FlagProps {
  className?: string;
  /** "none" allunga la bandiera fino a riempire tutto il riquadro: serve allo
   * sfondo della casella, che è più alto che largo (o viceversa sulle colonne
   * laterali), dove il fit predefinito lasciava due bande vuote. */
  preserveAspectRatio?: string;
}

function Stripes({ colors, vertical }: { colors: string[]; vertical?: boolean }) {
  const n = colors.length;
  return (
    <>
      {colors.map((c, i) =>
        vertical ? (
          <rect key={i} x={(i * 24) / n} y="0" width={24 / n} height="16" fill={c} />
        ) : (
          <rect key={i} x="0" y={(i * 16) / n} width="24" height={16 / n} fill={c} />
        )
      )}
    </>
  );
}

function NL({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <Stripes colors={["#AE1C28", "#FFFFFF", "#21468B"]} />
    </svg>
  );
}

function IT({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <Stripes colors={["#009246", "#FFFFFF", "#CE2B37"]} vertical />
    </svg>
  );
}

function DE({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <Stripes colors={["#000000", "#DD0000", "#FFCE00"]} />
    </svg>
  );
}

function GB({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#00247D" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#CF142B" strokeWidth="1.2" />
      <path d="M12 0v16M0 8h24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0v16M0 8h24" stroke="#CF142B" strokeWidth="2.2" />
    </svg>
  );
}

function GR({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#0D5EAF" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="0" y={i * 3.56} width="24" height="1.78" fill="#fff" />
      ))}
      <rect x="0" y="0" width="9" height="8.9" fill="#0D5EAF" />
      <rect x="3.4" y="0" width="2.2" height="8.9" fill="#fff" />
      <rect x="0" y="3.35" width="9" height="2.2" fill="#fff" />
    </svg>
  );
}

function BR({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#009739" />
      <path d="M12 2 22 8 12 14 2 8Z" fill="#FEDD00" />
      <circle cx="12" cy="8" r="3.2" fill="#012169" />
    </svg>
  );
}

function ES({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </svg>
  );
}

function FR({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <Stripes colors={["#0055A4", "#FFFFFF", "#EF4135"]} vertical />
    </svg>
  );
}

function JP({ className, preserveAspectRatio }: FlagProps) {
  return (
    <svg viewBox="0 0 24 16" preserveAspectRatio={preserveAspectRatio} className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <circle cx="12" cy="8" r="4.2" fill="#BC002D" />
    </svg>
  );
}

const FLAG_COMPONENTS: Record<CountryCode, (props: FlagProps) => JSX.Element> = {
  NL,
  IT,
  DE,
  GB,
  GR,
  BR,
  ES,
  FR,
  JP,
};

export function CountryFlag({
  code,
  className,
  preserveAspectRatio,
}: {
  code: CountryCode;
  className?: string;
  preserveAspectRatio?: string;
}) {
  const Flag = FLAG_COMPONENTS[code];
  return <Flag className={className} preserveAspectRatio={preserveAspectRatio} />;
}
