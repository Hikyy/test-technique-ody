export type JsonApiError = {
  status?: string | number;
  code?: string;
  title?: string;
  detail?: string;
  source?: unknown;
};

export type JsonApiErrorBody = {
  errors: JsonApiError[];
};

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

export type ApiSingle<T, I = unknown> = {
  data: T;
  included: I[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: JsonApiError[];

  constructor(status: number, code: string, message: string, errors: JsonApiError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipRetry?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function redirectToLoginIfUnauthorized(res: Response): void {
  if (res.status !== 401) return;
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  const next = window.location.pathname + window.location.search;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

async function parseError(res: Response): Promise<ApiError> {
  let body: JsonApiErrorBody | undefined;
  try {
    body = (await res.json()) as JsonApiErrorBody;
  } catch {
    body = undefined;
  }
  const first = body?.errors?.[0];
  const code = first?.code ?? `HTTP_${res.status}`;
  const message = first?.detail ?? first?.title ?? res.statusText ?? "Request failed";
  return new ApiError(res.status, code, message, body?.errors ?? []);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function tenantHeaders(): Record<string, string> {
  const out: Record<string, string> = {};
  const org = readCookie("seve_active_org");
  const rest = readCookie("seve_active_restaurant");
  if (org) out["x-organization-id"] = org;
  if (rest) out["x-restaurant-id"] = rest;
  return out;
}

async function rawFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { body, query, headers, skipRetry: _skip, ...rest } = options;
  void _skip;
  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...tenantHeaders(),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const url = buildUrl(path, query);
  try {
    return await fetch(url, init);
  } catch (err) {
    throw new ApiError(0, "NETWORK_ERROR", (err as Error).message);
  }
}

async function readBody<T>(res: Response): Promise<T | undefined> {
  if (res.status === 204) return undefined;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json") && !ct.includes("application/vnd.api+json")) {
    return undefined;
  }
  return (await res.json()) as T;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  let res = await rawFetch(path, options);
  if (res.status === 401 && !options.skipRetry) {
    res = await rawFetch(path, options);
  }
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res);
    throw await parseError(res);
  }

  const body = await readBody<JsonApiResource<T> | T>(res);
  if (body === undefined) return undefined as T;

  if (typeof body === "object" && body !== null && "data" in (body as object)) {
    return (body as JsonApiResource<T>).data;
  }
  return body as T;
}

export async function apiList<T, I = unknown>(path: string, options: FetchOptions = {}): Promise<ApiList<T, I>> {
  let res = await rawFetch(path, options);
  if (res.status === 401 && !options.skipRetry) {
    res = await rawFetch(path, options);
  }
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res);
    throw await parseError(res);
  }

  const body = await readBody<JsonApiCollection<T, I>>(res);
  if (!body || !Array.isArray(body.data)) {
    return { items: [], included: [], meta: {}, links: {} };
  }
  return {
    items: body.data,
    included: Array.isArray(body.included) ? body.included : [],
    meta: body.meta ?? {},
    links: body.links ?? {},
  };
}

export async function apiSingleEnvelope<T, I = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiSingle<T, I>> {
  let res = await rawFetch(path, options);
  if (res.status === 401 && !options.skipRetry) {
    res = await rawFetch(path, options);
  }
  if (!res.ok) {
    redirectToLoginIfUnauthorized(res);
    throw await parseError(res);
  }
  const body = await readBody<JsonApiResource<T, I>>(res);
  if (!body || !("data" in body)) {
    throw new ApiError(500, "INVALID_RESPONSE", "Missing data envelope");
  }
  return {
    data: body.data,
    included: Array.isArray(body.included) ? body.included : [],
  };
}

export function apiGet<T>(path: string, options?: Omit<FetchOptions, "body" | "method">): Promise<T> {
  return apiFetch<T>(path, { ...(options ?? {}), method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options?: Omit<FetchOptions, "body" | "method">): Promise<T> {
  return apiFetch<T>(path, { ...(options ?? {}), method: "POST", body });
}

export function apiPatch<T>(path: string, body?: unknown, options?: Omit<FetchOptions, "body" | "method">): Promise<T> {
  return apiFetch<T>(path, { ...(options ?? {}), method: "PATCH", body });
}

export function apiDelete<T>(path: string, options?: Omit<FetchOptions, "body" | "method">): Promise<T> {
  return apiFetch<T>(path, { ...(options ?? {}), method: "DELETE" });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
    body: formData,
  }).catch((err: Error) => {
    throw new ApiError(0, "NETWORK_ERROR", err.message);
  });

  if (!res.ok) {
    redirectToLoginIfUnauthorized(res);
    throw await parseError(res);
  }

  const body = await readBody<JsonApiResource<T>>(res);

  if (!body || !("data" in body)) {
    throw new ApiError(500, "INVALID_RESPONSE", "Missing data envelope");
  }

  return body.data;
}

export const apiBaseUrl = API_URL;
