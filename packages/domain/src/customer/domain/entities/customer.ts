/**
 * Customer aggregate root. Invariant: at least one of email/phone present.
 */

import type { Email } from "../../../shared-kernel/email.js";
import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import type { PhoneNumber } from "../../../shared-kernel/phone-number.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { type CustomerId, newCustomerId } from "../value-objects/customer-id.js";

export interface CustomerProps {
  id: CustomerId;
  firstName: string;
  lastName: string;
  email: Email | null;
  phone: PhoneNumber | null;
  notes: string | null;
  visitsCount: number;
  spent: Money;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  id?: CustomerId;
  firstName: string;
  lastName: string;
  email?: Email | null;
  phone?: PhoneNumber | null;
  notes?: string | null;
  createdAt?: Date;
}

export interface UpdateCustomerPatch {
  firstName?: string;
  lastName?: string;
  email?: Email | null;
  phone?: PhoneNumber | null;
  notes?: string | null;
}

const validateName = (name: string, field: string): Result<string, DomainError> => {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 80) {
    return Err(new ValidationError(`Customer.${field} length must be 1..80`));
  }
  return Ok(trimmed);
};

export class Customer {
  private constructor(private props: CustomerProps) {}

  static create(input: CreateCustomerInput): Result<Customer, DomainError> {
    const first = validateName(input.firstName, "firstName");
    if (!first.ok) return first;
    const last = validateName(input.lastName, "lastName");
    if (!last.ok) return last;

    const email = input.email ?? null;
    const phone = input.phone ?? null;
    if (!email && !phone) {
      return Err(new ValidationError("Customer requires at least one of email or phone"));
    }
    const now = input.createdAt ?? new Date();
    return Ok(
      new Customer({
        id: input.id ?? newCustomerId(),
        firstName: first.value,
        lastName: last.value,
        email,
        phone,
        notes: input.notes ?? null,
        visitsCount: 0,
        spent: Money.zero(),
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  static restore(props: CustomerProps): Customer {
    return new Customer(props);
  }

  get id(): CustomerId {
    return this.props.id;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }
  get email(): Email | null {
    return this.props.email;
  }
  get phone(): PhoneNumber | null {
    return this.props.phone;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get visitsCount(): number {
    return this.props.visitsCount;
  }
  get spent(): Money {
    return this.props.spent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  recordVisit(amount: Money, at: Date = new Date()): void {
    this.props = {
      ...this.props,
      visitsCount: this.props.visitsCount + 1,
      spent: this.props.spent.add(amount),
      updatedAt: at,
    };
  }

  update(patch: UpdateCustomerPatch, at: Date = new Date()): Result<void, DomainError> {
    const next = { ...this.props, updatedAt: at };

    if (patch.firstName !== undefined) {
      const r = validateName(patch.firstName, "firstName");
      if (!r.ok) return r;
      next.firstName = r.value;
    }
    if (patch.lastName !== undefined) {
      const r = validateName(patch.lastName, "lastName");
      if (!r.ok) return r;
      next.lastName = r.value;
    }
    if (patch.email !== undefined) next.email = patch.email;
    if (patch.phone !== undefined) next.phone = patch.phone;
    if (patch.notes !== undefined) next.notes = patch.notes;

    if (!next.email && !next.phone) {
      return Err(new ValidationError("Customer requires at least one of email or phone"));
    }
    this.props = next;
    return Ok(undefined);
  }
}
