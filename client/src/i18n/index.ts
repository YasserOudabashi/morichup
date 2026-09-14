import { useEffect, useState } from "react";
import en from "./en.json";
import it from "./it.json";

export type Locale = "en" | "it";

const dictionaries: Record<Locale, Record<string, string>> = { en, it };
const LOCALE_KEY = "morichup.locale";

function detectInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "it") return saved;
  } catch {
    // localStorage non disponibile: usa il rilevamento dal browser.
  }
  return navigator.language?.toLowerCase().startsWith("it") ? "it" : "en";
}

let currentLocale: Locale = typeof window === "undefined" ? "en" : detectInitialLocale();
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // localStorage non disponibile: la scelta vale solo per questo caricamento.
  }
  listeners.forEach((listener) => listener());
}

/** Per ricalcolare la UI quando cambia la lingua (usato da un piccolo hook React). */
export function onLocaleChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function t(key: string, params?: Record<string, string | number>): string {
  const template = dictionaries[currentLocale][key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    template
  );
}

/** Fa ri-renderizzare il componente quando cambia la lingua (es. dopo setLocale altrove). */
export function useLocale(): Locale {
  const [locale, setLocaleState] = useState(currentLocale);
  useEffect(() => onLocaleChange(() => setLocaleState(currentLocale)), []);
  return locale;
}
