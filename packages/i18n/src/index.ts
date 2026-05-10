import { en } from "./messages/en";
import { fr } from "./messages/fr";

export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";

export const locales: readonly Locale[] = ["fr", "en"] as const;

export type Messages = typeof fr;

const dictionaries: Record<Locale, Messages> = {
  fr,
  en: en as unknown as Messages,
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export { en, fr };
