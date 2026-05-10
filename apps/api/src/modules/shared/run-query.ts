import { type DomainError, Err, Ok, type Result } from "@ody/domain/shared-kernel";

interface PgErrorLike {
  message?: string;
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

const toInfrastructureError = (e: unknown): DomainError => {
  const cause = e as PgErrorLike;
  const parts: string[] = [];

  if (cause?.message) parts.push(cause.message);

  if (cause?.code) parts.push(`(pg ${cause.code})`);

  if (cause?.detail) parts.push(cause.detail);

  if (cause?.constraint) parts.push(`constraint=${cause.constraint}`);

  const message = parts.length > 0 ? parts.join(" — ") : "Unknown infrastructure error";
  const wrap = new Error(message) as Error & { code: string; cause?: unknown };

  wrap.name = "InfrastructureError";
  wrap.code = "INFRASTRUCTURE";
  wrap.cause = e;

  return wrap as unknown as DomainError;
};

export async function runQuery<T>(fn: () => Promise<T>): Promise<Result<T, DomainError>> {
  try {
    return Ok(await fn());
  } catch (e) {
    return Err(toInfrastructureError(e));
  }
}
