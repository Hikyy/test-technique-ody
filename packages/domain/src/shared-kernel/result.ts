/**
 * Result<T, E> — discriminated union, no exceptions across application boundaries.
 * Domain code returns Result; only constructors enforcing invariants throw InvariantViolation.
 */

export type Result<T, E> = OkResult<T> | ErrResult<E>;

export interface OkResult<T> {
  readonly ok: true;
  readonly value: T;
}

export interface ErrResult<E> {
  readonly ok: false;
  readonly error: E;
}

export const Ok = <T>(value: T): OkResult<T> => ({ ok: true, value });
export const Err = <E>(error: E): ErrResult<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is OkResult<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is ErrResult<E> => !r.ok;

export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> => (r.ok ? Ok(fn(r.value)) : r);

export const mapErr = <T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> => (r.ok ? r : Err(fn(r.error)));

export const andThen = <T, U, E>(r: Result<T, E>, fn: (v: T) => Result<U, E>): Result<U, E> => (r.ok ? fn(r.value) : r);

/** Combine many Results — first error wins. */
export const all = <T, E>(rs: ReadonlyArray<Result<T, E>>): Result<T[], E> => {
  const out: T[] = [];
  for (const r of rs) {
    if (!r.ok) return r;
    out.push(r.value);
  }
  return Ok(out);
};

export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T => (r.ok ? r.value : fallback);
