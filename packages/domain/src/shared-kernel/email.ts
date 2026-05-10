/**
 * Email value object. Validated, normalized lowercase, equality by value.
 */

import { ValidationError } from "./errors.js";
import { Err, Ok, type Result } from "./result.js";

// Pragmatic RFC-5322-ish regex (no comments / ip-literal). Sufficient for this scope.
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Email, ValidationError> {
    if (typeof raw !== "string" || raw.length === 0) {
      return Err(new ValidationError("Email is required"));
    }
    const normalized = raw.trim().toLowerCase();
    if (normalized.length > 254) {
      return Err(new ValidationError("Email too long"));
    }
    if (!EMAIL_RE.test(normalized)) {
      return Err(new ValidationError("Invalid email format", { raw }));
    }
    return Ok(new Email(normalized));
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
