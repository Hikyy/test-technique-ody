export type JsonApiError = {
  status?: string | number;
  code?: string;
  title?: string;
  detail?: string;
  source?: unknown;
};

export type JsonApiErrorBody = { errors: JsonApiError[] };

export type JsonApiMeta = {
  total?: number;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
};

export type JsonApiLinks = {
  self?: string;
  next?: string | null;
  prev?: string | null;
  [key: string]: string | null | undefined;
};

export type JsonApiCollection<T, I = unknown> = {
  data: T[];
  included?: I[];
  meta?: JsonApiMeta;
  links?: JsonApiLinks;
};

export type JsonApiResource<T, I = unknown> = {
  data: T;
  included?: I[];
  meta?: JsonApiMeta;
};

export type ApiList<T, I = unknown> = {
  items: T[];
  included: I[];
  meta: JsonApiMeta;
  links: JsonApiLinks;
};

export type ApiSingle<T, I = unknown> = { data: T; included: I[] };
