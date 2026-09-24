import type { CountryCode } from "../components/flags";

/** Paese per ogni città usata come nome di una casella "property" in una
 * delle mappe (vedi shared/src/maps/*.ts): un gruppo colore è sempre città
 * dello stesso paese, quindi il paese si guarda per città, non per casella
 * singola. Solo dati, nessuna logica: se una mappa futura aggiunge una città
 * qui assente, la casella resta senza bandiera invece di rompersi. */
const CITY_COUNTRY: Record<string, CountryCode> = {
  // Netherlands
  Amsterdam: "NL",
  Rotterdam: "NL",
  "The Hague": "NL",
  // Italy
  Rome: "IT",
  Milan: "IT",
  Venice: "IT",
  // Germany
  Berlin: "DE",
  Munich: "DE",
  Frankfurt: "DE",
  // United Kingdom
  London: "GB",
  Manchester: "GB",
  Liverpool: "GB",
  // Greece
  Athens: "GR",
  Thessaloniki: "GR",
  Patras: "GR",
  // Brazil
  Salvador: "BR",
  Brasilia: "BR",
  "Rio de Janeiro": "BR",
  // Spain
  Seville: "ES",
  Valencia: "ES",
  Madrid: "ES",
  // France
  Lyon: "FR",
  Marseille: "FR",
  Paris: "FR",
  // Japan
  Osaka: "JP",
  Yokohama: "JP",
  Tokyo: "JP",
  // Thailand
  "Chiang Mai": "TH",
  Phuket: "TH",
  Bangkok: "TH",
};

export function flagFor(cityName: string): CountryCode | null {
  return CITY_COUNTRY[cityName] ?? null;
}
