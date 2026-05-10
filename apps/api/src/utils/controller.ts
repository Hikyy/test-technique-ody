import type { Result } from "@ody/domain/shared-kernel";
import type { Context, MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import type { z } from "zod";
import { type AppEnv, factory } from "../factory.js";
import { errorEntry, errorResponses } from "./error-responses.js";
import {
  buildCollection,
  buildCollectionWithIncluded,
  buildSingleWithIncluded,
  type JsonApiResourceLike,
  jsonApiCollectionSchema,
  jsonApiCollectionWithIncludedSchema,
  jsonApiSingleSchema,
  jsonApiSingleWithIncludedSchema,
} from "./json-api.js";
import { type DomainErrorLike, domainErrorToJsonApi } from "./result-to-http.js";
import { zv } from "./validator.js";

type Z = z.ZodTypeAny;

export interface SingleResponseSpec<S extends Z = Z> {
  single: S;
  status?: 200 | 201;
  description?: string;
}
export interface CollectionResponseSpec<S extends Z = Z> {
  collection: S;
  description?: string;
}
export interface SingleWithIncludedSpec<S extends Z = Z, I extends Z = Z> {
  single: S;
  included: I;
  status?: 200 | 201;
  description?: string;
}
export interface CollectionWithIncludedSpec<S extends Z = Z, I extends Z = Z> {
  collection: S;
  included: I;
  description?: string;
}
export interface NoContentSpec {
  noContent: true;
  description?: string;
}
export type ResponseSpec =
  | SingleResponseSpec
  | CollectionResponseSpec
  | SingleWithIncludedSpec
  | CollectionWithIncludedSpec
  | NoContentSpec;

export type ErrorSet = "minimal" | "full";

export interface ControllerSpec {
  readonly tag: string;
  readonly summary: string;
  readonly description?: string;
  readonly errorSet?: ErrorSet;
  readonly params?: Z;
  readonly query?: Z;
  readonly request?: Z;
  readonly body?: Z;
  readonly response: ResponseSpec;
  // biome-ignore lint/suspicious/noExplicitAny: __invoke args are validated by Zod at runtime; controllers receive the inferred shape from their own params/query/request schemas.
  readonly __invoke: (args: { params: any; query: any; body: any; context: Context<AppEnv> }) => unknown;
}

export type Ctx<S extends ControllerSpec> = {
  params: S["params"] extends Z ? z.infer<S["params"]> : never;
  query: S["query"] extends Z ? z.infer<S["query"]> : never;
  body: S["request"] extends Z ? z.infer<S["request"]> : S["body"] extends Z ? z.infer<S["body"]> : never;
  context: Context<AppEnv>;
};

const minimalErrorResponses = {
  401: errorEntry("Unauthenticated"),
  500: errorEntry("Internal"),
} as const;

type ErrorResponsesShape = typeof errorResponses | typeof minimalErrorResponses;
const buildErrors = (set: ErrorSet): ErrorResponsesShape =>
  set === "minimal" ? minimalErrorResponses : errorResponses;

const jsonContent = <S extends Z>(s: S) => ({
  "application/json": { schema: resolver(s) },
});

const buildDescribe = (spec: ControllerSpec, errors: ErrorResponsesShape): MiddlewareHandler => {
  const { tag, summary, description, response } = spec;
  const base = {
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    security: [{ bearerAuth: [] as string[] }],
  };

  if ("noContent" in response) {
    return describeRoute({ ...base, responses: { ...errors } });
  }

  if ("single" in response && "included" in response) {
    const status = response.status ?? 200;

    return describeRoute({
      ...base,
      responses: {
        [status]: {
          description: response.description ?? summary,
          content: jsonContent(jsonApiSingleWithIncludedSchema(response.single, response.included)),
        },
        ...errors,
      },
    });
  }

  if ("collection" in response && "included" in response) {
    return describeRoute({
      ...base,
      responses: {
        200: {
          description: response.description ?? summary,
          content: jsonContent(jsonApiCollectionWithIncludedSchema(response.collection, response.included)),
        },
        ...errors,
      },
    });
  }

  if ("collection" in response) {
    return describeRoute({
      ...base,
      responses: {
        200: {
          description: response.description ?? summary,
          content: jsonContent(jsonApiCollectionSchema(response.collection)),
        },
        ...errors,
      },
    });
  }

  const status = response.status ?? 200;

  return describeRoute({
    ...base,
    responses: {
      [status]: {
        description: response.description ?? summary,
        content: jsonContent(jsonApiSingleSchema(response.single)),
      },
      ...errors,
    },
  });
};

const isResult = (v: unknown): v is Result<unknown, DomainErrorLike> => {
  if (typeof v !== "object" || v === null) return false;

  const r = v as { ok?: unknown };

  return typeof r.ok === "boolean";
};

const unwrap = (c: Context<AppEnv>, v: unknown): { ok: true; value: unknown } | { ok: false; response: Response } => {
  if (isResult(v)) {
    if (v.ok) return { ok: true, value: v.value };

    const { status, body } = domainErrorToJsonApi(v.error as DomainErrorLike);

    return { ok: false, response: c.json(body, status) };
  }

  return { ok: true, value: v };
};

interface CollectionPayload {
  items: unknown[];
  total: number;
  page: number;
  pageSize: number;
  meta?: Record<string, unknown>;
}
interface CollectionWithIncludedPayload {
  items: unknown[];
  included: JsonApiResourceLike[];
  total: number;
  page: number;
  pageSize: number;
  meta?: Record<string, unknown>;
}
interface SingleWithIncludedPayload {
  data: unknown;
  included: JsonApiResourceLike[];
}

export function handle(spec: ControllerSpec): readonly [MiddlewareHandler<AppEnv>, ...MiddlewareHandler<AppEnv>[]] {
  const errors = buildErrors(spec.errorSet ?? "full");
  const meta = buildDescribe(spec, errors);

  const paramsSchema = spec.params;
  const querySchema = spec.query;
  const bodySchema = spec.request ?? spec.body;

  const validators: MiddlewareHandler[] = [];

  if (paramsSchema) validators.push(zv("param", paramsSchema));

  if (querySchema) validators.push(zv("query", querySchema));

  if (bodySchema) validators.push(zv("json", bodySchema));

  const response = spec.response;
  const invoke = spec.__invoke;

  const handler: MiddlewareHandler<AppEnv> = async (c) => {
    const reqValid = c.req as unknown as {
      valid: (target: "param" | "query" | "json") => unknown;
    };
    const params = paramsSchema ? reqValid.valid("param") : undefined;
    const query = querySchema ? reqValid.valid("query") : undefined;
    const body = bodySchema ? reqValid.valid("json") : undefined;

    const raw = await invoke({ params, query, body, context: c });

    if ("noContent" in response) {
      const out = unwrap(c, raw);

      if (!out.ok) return out.response;

      return c.body(null, 204);
    }

    if ("single" in response && "included" in response) {
      const out = unwrap(c, raw);

      if (!out.ok) return out.response;

      const payload = out.value as SingleWithIncludedPayload;
      const status = (response.status ?? 200) as ContentfulStatusCode;

      return c.json(buildSingleWithIncluded(payload.data, payload.included), status);
    }

    if ("collection" in response && "included" in response) {
      const out = unwrap(c, raw);

      if (!out.ok) return out.response;

      const payload = out.value as CollectionWithIncludedPayload;
      const built = buildCollectionWithIncluded(
        payload.items,
        payload.included,
        { total: payload.total, page: payload.page, pageSize: payload.pageSize },
        c.req.url,
        (item) => item,
      );

      const enriched = payload.meta ? { ...built, meta: { ...built.meta, ...payload.meta } } : built;

      return c.json(enriched, 200);
    }

    if ("collection" in response) {
      const out = unwrap(c, raw);

      if (!out.ok) return out.response;

      const payload = out.value as CollectionPayload;
      const built = buildCollection(
        payload.items,
        { total: payload.total, page: payload.page, pageSize: payload.pageSize },
        c.req.url,
        (item) => item,
      );

      const enriched = payload.meta ? { ...built, meta: { ...built.meta, ...payload.meta } } : built;

      return c.json(enriched, 200);
    }

    const out = unwrap(c, raw);

    if (!out.ok) return out.response;

    const status = (response.status ?? 200) as ContentfulStatusCode;

    return c.json({ data: out.value }, status);
  };

  const all: MiddlewareHandler<AppEnv>[] = [meta, ...validators, handler];

  return (
    factory.createHandlers as (
      ...h: MiddlewareHandler<AppEnv>[]
    ) => readonly [MiddlewareHandler<AppEnv>, ...MiddlewareHandler<AppEnv>[]]
  )(...all);
}
