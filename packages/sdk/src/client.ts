import { ApiError } from "./error";
import type { ApiList, ApiSingle, JsonApiCollection, JsonApiErrorBody, JsonApiResource } from "./types";

export type AuthHeadersGetter = () =>
  | Record<string, string>
  | null
  | undefined
  | Promise<Record<string, string> | null | undefined>;

export type TenantHeadersGetter = () => Record<string, string> | null | undefined;

export interface ApiClientConfig {
  baseUrl: string;
  getAuthHeaders?: AuthHeadersGetter;
  getTenantHeaders?: TenantHeadersGetter;
  credentials?: RequestCredentials;
}

export interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  skipRetry?: boolean;
}

export interface ApiClient {
  readonly baseUrl: string;
  apiFetch<T>(path: string, options?: FetchOptions): Promise<T>;
  apiList<T, I = unknown>(path: string, options?: FetchOptions): Promise<ApiList<T, I>>;
  apiSingleEnvelope<T, I = unknown>(path: string, options?: FetchOptions): Promise<ApiSingle<T, I>>;
  apiGet<T>(path: string, options?: Omit<FetchOptions, "body" | "method">): Promise<T>;
  apiPost<T>(path: string, body?: unknown, options?: Omit<FetchOptions, "body" | "method">): Promise<T>;
  apiPatch<T>(path: string, body?: unknown, options?: Omit<FetchOptions, "body" | "method">): Promise<T>;
  apiDelete<T>(path: string, options?: Omit<FetchOptions, "body" | "method">): Promise<T>;
  apiUpload<T>(path: string, formData: FormData): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, getAuthHeaders, getTenantHeaders, credentials } = config;

  const buildUrl = (path: string, query?: FetchOptions["query"]): string => {
    const base = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    if (!query) return base;

    const params = new URLSearchParams();

    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      params.set(k, String(v));
    }

    const qs = params.toString();

    return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
  };

  const parseError = async (res: Response): Promise<ApiError> => {
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
  };

  const rawFetch = async (path: string, options: FetchOptions = {}): Promise<Response> => {
    const { body, query, headers, skipRetry: _skip, ...rest } = options;
    void _skip;

    const auth = (await getAuthHeaders?.()) ?? {};
    const tenant = getTenantHeaders?.() ?? {};

    const init: RequestInit = {
      ...(credentials ? { credentials } : {}),
      ...rest,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...auth,
        ...tenant,
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
  };

  const readBody = async <T>(res: Response): Promise<T | undefined> => {
    if (res.status === 204) return undefined;

    const ct = res.headers.get("content-type") ?? "";

    if (!ct.includes("application/json") && !ct.includes("application/vnd.api+json")) return undefined;

    return (await res.json()) as T;
  };

  const apiFetch = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
    let res = await rawFetch(path, options);

    if (res.status === 401 && !options.skipRetry) {
      res = await rawFetch(path, options);
    }

    if (!res.ok) throw await parseError(res);

    const body = await readBody<JsonApiResource<T> | T>(res);

    if (body === undefined) return undefined as T;

    if (typeof body === "object" && body !== null && "data" in (body as object)) {
      return (body as JsonApiResource<T>).data;
    }

    return body as T;
  };

  const apiList = async <T, I = unknown>(path: string, options: FetchOptions = {}): Promise<ApiList<T, I>> => {
    const res = await rawFetch(path, options);

    if (!res.ok) throw await parseError(res);

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
  };

  const apiSingleEnvelope = async <T, I = unknown>(
    path: string,
    options: FetchOptions = {},
  ): Promise<ApiSingle<T, I>> => {
    const res = await rawFetch(path, options);

    if (!res.ok) throw await parseError(res);

    const body = await readBody<JsonApiResource<T, I>>(res);

    if (!body || !("data" in body)) {
      throw new ApiError(500, "INVALID_RESPONSE", "Missing data envelope");
    }

    return {
      data: body.data,
      included: Array.isArray(body.included) ? body.included : [],
    };
  };

  const apiGet = <T>(path: string, options?: Omit<FetchOptions, "body" | "method">) =>
    apiFetch<T>(path, { ...(options ?? {}), method: "GET" });

  const apiPost = <T>(path: string, body?: unknown, options?: Omit<FetchOptions, "body" | "method">) =>
    apiFetch<T>(path, { ...(options ?? {}), method: "POST", body });

  const apiPatch = <T>(path: string, body?: unknown, options?: Omit<FetchOptions, "body" | "method">) =>
    apiFetch<T>(path, { ...(options ?? {}), method: "PATCH", body });

  const apiDelete = <T>(path: string, options?: Omit<FetchOptions, "body" | "method">) =>
    apiFetch<T>(path, { ...(options ?? {}), method: "DELETE" });

  const apiUpload = async <T>(path: string, formData: FormData): Promise<T> => {
    const auth = (await getAuthHeaders?.()) ?? {};
    const tenant = getTenantHeaders?.() ?? {};
    const res = await fetch(buildUrl(path), {
      method: "POST",
      ...(credentials ? { credentials } : {}),
      headers: { Accept: "application/json", ...auth, ...tenant },
      body: formData,
    }).catch((err: Error) => {
      throw new ApiError(0, "NETWORK_ERROR", err.message);
    });

    if (!res.ok) throw await parseError(res);

    const body = await readBody<JsonApiResource<T>>(res);

    if (!body || !("data" in body)) {
      throw new ApiError(500, "INVALID_RESPONSE", "Missing data envelope");
    }

    return body.data;
  };

  return {
    baseUrl,
    apiFetch,
    apiList,
    apiSingleEnvelope,
    apiGet,
    apiPost,
    apiPatch,
    apiDelete,
    apiUpload,
  };
}
