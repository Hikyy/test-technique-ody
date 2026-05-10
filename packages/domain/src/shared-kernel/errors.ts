/**
 * Domain error hierarchy. Application returns Err(DomainError); HTTP layer maps to status code.
 */

export type DomainErrorCode =
  | "INVARIANT_VIOLATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "FORBIDDEN"
  | "INVALID_TRANSITION";

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details?: Readonly<Record<string, unknown>>;

  constructor(code: DomainErrorCode, message: string, details?: Readonly<Record<string, unknown>>) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

/** Thrown by entity constructors when an invariant cannot be satisfied. */
export class InvariantViolation extends DomainError {
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super("INVARIANT_VIOLATION", message, details);
    this.name = "InvariantViolation";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} not found: ${id}`, { entity, id });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super("CONFLICT", message, details);
    this.name = "ConflictError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Readonly<Record<string, unknown>>) {
    super("VALIDATION", message, details);
    this.name = "ValidationError";
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super("INVALID_TRANSITION", `Cannot transition from ${from} to ${to}`, {
      from,
      to,
    });
    this.name = "InvalidTransitionError";
  }
}
