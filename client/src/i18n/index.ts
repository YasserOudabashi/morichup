import en from "./en.json";
import it from "./it.json";

export type Locale = "en" | "it";

const dictionaries: Record<Locale, Record<string, string>> = { en, it };

// Fase 0: locale fisso su "en". Selezione persistente e cambio a runtime
// arrivano con la lobby (docs/ROADMAP.md, Fase 3).
let currentLocale: Locale = "en";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function t(key: string): string {
  return dictionaries[currentLocale][key] ?? key;
}
