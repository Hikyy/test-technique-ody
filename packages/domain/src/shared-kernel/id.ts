declare const __brand: unique symbol;

export type Id<Brand extends string> = string & { readonly [__brand]: Brand };

declare const crypto: { randomUUID(): string };

export const newId = <Brand extends string>(): Id<Brand> => crypto.randomUUID() as Id<Brand>;

export const toId = <Brand extends string>(raw: string): Id<Brand> => raw as Id<Brand>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (raw: string): boolean => UUID_RE.test(raw);
