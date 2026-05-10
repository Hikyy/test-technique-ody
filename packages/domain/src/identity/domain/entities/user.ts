/**
 * User aggregate root.
 */

import type { Email } from "../../../shared-kernel/email.js";
import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Role } from "../value-objects/role.js";
import { newUserId, type UserId } from "../value-objects/user-id.js";

export interface UserProps {
  id: UserId;
  email: Email;
  name: string;
  role: Role;
  createdAt: Date;
}

export interface CreateUserInput {
  id?: UserId;
  email: Email;
  name: string;
  role: Role;
  createdAt?: Date;
}

export class User {
  private constructor(private props: UserProps) {}

  static create(input: CreateUserInput): Result<User, DomainError> {
    const trimmed = input.name.trim();
    if (trimmed.length < 1 || trimmed.length > 120) {
      return Err(new ValidationError("User.name length must be 1..120"));
    }
    return Ok(
      new User({
        id: input.id ?? newUserId(),
        email: input.email,
        name: trimmed,
        role: input.role,
        createdAt: input.createdAt ?? new Date(),
      }),
    );
  }

  /** Restore from persistence — bypasses creation invariants minus structural ones. */
  static restore(props: UserProps): User {
    return new User(props);
  }

  get id(): UserId {
    return this.props.id;
  }
  get email(): Email {
    return this.props.email;
  }
  get name(): string {
    return this.props.name;
  }
  get role(): Role {
    return this.props.role;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  changeRole(next: Role): void {
    this.props = { ...this.props, role: next };
  }

  rename(next: string): Result<void, DomainError> {
    const trimmed = next.trim();
    if (trimmed.length < 1 || trimmed.length > 120) {
      return Err(new ValidationError("User.name length must be 1..120"));
    }
    this.props = { ...this.props, name: trimmed };
    return Ok(undefined);
  }
}
