/** Bandiera (emoji) per ogni nazione usata come nome di una casella "property"
 * in una delle mappe (vedi shared/src/maps/*.ts). Solo dati, nessuna logica:
 * se una mappa futura aggiunge una nazione qui assente, la casella resta
 * semplicemente senza icona invece di rompersi. */
const COUNTRY_FLAGS: Record<string, string> = {
  Nepal: "🇳🇵",
  Bhutan: "🇧🇹",
  Mongolia: "🇲🇳",
  Vietnam: "🇻🇳",
  Cambodia: "🇰🇭",
  Laos: "🇱🇦",
  Thailand: "🇹🇭",
  Philippines: "🇵🇭",
  Indonesia: "🇮🇩",
  Mexico: "🇲🇽",
  Peru: "🇵🇪",
  Colombia: "🇨🇴",
  Turkey: "🇹🇷",
  Greece: "🇬🇷",
  Portugal: "🇵🇹",
  Egypt: "🇪🇬",
  Morocco: "🇲🇦",
  Kenya: "🇰🇪",
  Argentina: "🇦🇷",
  Chile: "🇨🇱",
  Brazil: "🇧🇷",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Poland: "🇵🇱",
  Germany: "🇩🇪",
  France: "🇫🇷",
  "United Kingdom": "🇬🇧",
  Japan: "🇯🇵",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
};

export function flagFor(countryName: string): string | null {
  return COUNTRY_FLAGS[countryName] ?? null;
}
