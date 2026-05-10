import { fr } from "@ody/i18n/messages/fr";
import { useMemo } from "react";

type Messages = typeof fr;

type Path<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? P extends ""
      ? K
      : `${P}.${K}`
    : T[K] extends Record<string, unknown>
      ? Path<T[K], P extends "" ? K : `${P}.${K}`>
      : never;
}[keyof T & string];

export type MessageKey = Path<Messages>;

function resolve(obj: unknown, key: string): string {
  const parts = key.split(".");
  let current: unknown = obj;

  for (const p of parts) {
    if (current && typeof current === "object" && p in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }

  return typeof current === "string" ? current : key;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];

    return v === undefined ? `{${k}}` : String(v);
  });
}

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  return interpolate(resolve(fr, key), vars);
}

type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function useTranslations(namespace?: keyof Messages): Translator {
  return useMemo<Translator>(() => {
    if (!namespace) return (key, vars) => interpolate(resolve(fr, key), vars);

    return (subKey, vars) => interpolate(resolve(fr, `${String(namespace)}.${subKey}`), vars);
  }, [namespace]);
}

export const messages = fr;
