import type { Result } from "@ody/domain/shared-kernel";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { logger } from "../log.js";
import { errorsBody, type JsonApiError, type JsonApiErrors } from "./json-api.js";

export interface DomainErrorLike {
  readonly _tag?: string;
  readonly code?: string;
  readonly name?: string;
  readonly message: string;
  readonly details?: unknown;
}

interface ErrorMapping {
  readonly status: ContentfulStatusCode;
  readonly title: string;
  readonly codes?: readonly string[];
  readonly tags?: readonly string[];
}

const ERROR_MAPPINGS: readonly ErrorMapping[] = [
  {
    status: 404,
    title: "Not Found",
    codes: ["NOT_FOUND"],
    tags: ["NotFoundError"],
  },
  {
    status: 409,
    title: "Conflict",
    codes: ["CONFLICT"],
    tags: ["ConflictError"],
  },
  {
    status: 422,
    title: "Unprocessable Entity",
    codes: ["INVARIANT_VIOLATION", "INVALID_TRANSITION"],
    tags: ["InvariantViolation", "InvalidTransitionError"],
  },
  {
    status: 400,
    title: "Bad Request",
    codes: ["VALIDATION", "VALIDATION_ERROR"],
    tags: ["ValidationError"],
  },
  {
    status: 403,
    title: "Forbidden",
    codes: ["FORBIDDEN"],
    tags: ["ForbiddenError"],
  },
  {
    status: 401,
    title: "Unauthorized",
    codes: ["UNAUTHENTICATED", "UNAUTHORIZED"],
    tags: ["UnauthorizedError"],
  },
];

const FALLBACK_TITLES: Record<string, string> = {
  INTERNAL: "Internal Server Error",
  INTERNAL_ERROR: "Internal Server Error",
};

const findMapping = (err: DomainErrorLike): ErrorMapping | undefined => {
  const code = err.code;
  const tag = err._tag ?? err.name;

  for (const m of ERROR_MAPPINGS) {
    if (code && m.codes?.includes(code)) return m;

    if (tag && m.tags?.includes(tag)) return m;
  }

  return undefined;
};

export const statusForError = (err: DomainErrorLike): ContentfulStatusCode => findMapping(err)?.status ?? 500;

const codeForError = (err: DomainErrorLike): string => err.code ?? err._tag ?? err.name ?? "INTERNAL";

export function domainErrorToJsonApi(err: DomainErrorLike): {
  status: ContentfulStatusCode;
  body: JsonApiErrors;
} {
  const mapping = findMapping(err);
  const status = mapping?.status ?? 500;
  const code = codeForError(err);
  const title = mapping?.title ?? FALLBACK_TITLES[code] ?? "Error";
  const error: JsonApiError = {
    status: String(status),
    code,
    title,
    detail: err.message,
  };

  if (status >= 500) {
    logger.error({ err }, "domain error mapped to 500");
  }

  return { status, body: errorsBody([error]) };
}

export function resultToHttp<T>(
  c: Context,
  result: Result<T, DomainErrorLike>,
  successStatus: ContentfulStatusCode = 200,
): Response {
  if (result.ok) {
    return c.json(result.value as object, successStatus);
  }

  const { status, body } = domainErrorToJsonApi(result.error);

  return c.json(body, status);
}
