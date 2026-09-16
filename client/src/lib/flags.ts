/** Bandiera (emoji) del paese per ogni città usata come nome di una casella
 * "property" in una delle mappe (vedi shared/src/maps/*.ts): un gruppo colore
 * è sempre città dello stesso paese, quindi la bandiera si guarda per città,
 * non per casella singola. Solo dati, nessuna logica: se una mappa futura
 * aggiunge una città qui assente, la casella resta senza icona invece di
 * rompersi. */
const CITY_FLAGS: Record<string, string> = {
  // Nepal
  Pokhara: "🇳🇵",
  Lalitpur: "🇳🇵",
  Kathmandu: "🇳🇵",
  // Vietnam
  Hue: "🇻🇳",
  "Da Nang": "🇻🇳",
  Hanoi: "🇻🇳",
  // Thailand
  "Chiang Mai": "🇹🇭",
  Phuket: "🇹🇭",
  Bangkok: "🇹🇭",
  // Mexico
  Cancun: "🇲🇽",
  Guadalajara: "🇲🇽",
  "Mexico City": "🇲🇽",
  // Turkey
  Izmir: "🇹🇷",
  Antalya: "🇹🇷",
  Istanbul: "🇹🇷",
  // Egypt
  Luxor: "🇪🇬",
  Alexandria: "🇪🇬",
  Cairo: "🇪🇬",
  // Brazil
  Salvador: "🇧🇷",
  Brasilia: "🇧🇷",
  "Rio de Janeiro": "🇧🇷",
  // Spain
  Seville: "🇪🇸",
  Valencia: "🇪🇸",
  Madrid: "🇪🇸",
  // France
  Lyon: "🇫🇷",
  Marseille: "🇫🇷",
  Paris: "🇫🇷",
  // Japan
  Osaka: "🇯🇵",
  Yokohama: "🇯🇵",
  Tokyo: "🇯🇵",
};

export function flagFor(cityName: string): string | null {
  return CITY_FLAGS[cityName] ?? null;
}
