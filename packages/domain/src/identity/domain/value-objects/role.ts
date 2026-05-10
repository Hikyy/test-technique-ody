import { ValidationError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";

export type RoleValue = "chef" | "server" | "admin";

const ALLOWED: ReadonlySet<RoleValue> = new Set(["chef", "server", "admin"]);

export class Role {
  private constructor(public readonly value: RoleValue) {}

  static readonly chef = new Role("chef");
  static readonly server = new Role("server");
  static readonly admin = new Role("admin");

  static create(raw: string): Result<Role, ValidationError> {
    if (!ALLOWED.has(raw as RoleValue)) {
      return Err(new ValidationError(`Invalid role: ${raw}`, { allowed: [...ALLOWED] }));
    }
    return Ok(new Role(raw as RoleValue));
  }

  equals(other: Role): boolean {
    return this.value === other.value;
  }

  toString(): RoleValue {
    return this.value;
  }
}
