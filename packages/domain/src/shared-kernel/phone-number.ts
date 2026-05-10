/**
 * PhoneNumber VO. Accepts French local format (0X XX XX XX XX) or E.164 (+33XXXXXXXXX),
 * stores canonical E.164.
 */

import { ValidationError } from "./errors.js";
import { Err, Ok, type Result } from "./result.js";

const FR_E164 = /^\+33[1-9][0-9]{8}$/;
const FR_LOCAL = /^0[1-9][0-9]{8}$/;

export class PhoneNumber {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<PhoneNumber, ValidationError> {
    if (typeof raw !== "string" || raw.length === 0) {
      return Err(new ValidationError("Phone number is required"));
    }
    const cleaned = raw.replace(/[\s.\-()]/g, "");

    if (FR_E164.test(cleaned)) {
      return Ok(new PhoneNumber(cleaned));
    }
    if (FR_LOCAL.test(cleaned)) {
      return Ok(new PhoneNumber(`+33${cleaned.slice(1)}`));
    }
    return Err(new ValidationError("Invalid phone number", { raw }));
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
