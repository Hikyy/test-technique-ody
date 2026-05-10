import { Email } from "../../../shared-kernel/email.js";
import type { DomainError } from "../../../shared-kernel/errors.js";
import { PhoneNumber } from "../../../shared-kernel/phone-number.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { Customer } from "../../domain/entities/customer.js";
import type { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import type { CreateCustomerDTO } from "../../interface/dto/customer.dto.js";

export interface CreateCustomerDeps {
  customers: CustomerRepository;
}

export const createCustomer = async (
  input: { organizationId: string; data: CreateCustomerDTO },
  deps: CreateCustomerDeps,
): Promise<Result<Customer, DomainError>> => {
  let email = null as Email | null;
  if (input.data.email) {
    const r = Email.create(input.data.email);
    if (!r.ok) return r;
    email = r.value;
  }
  let phone = null as PhoneNumber | null;
  if (input.data.phone) {
    const r = PhoneNumber.create(input.data.phone);
    if (!r.ok) return r;
    phone = r.value;
  }

  const created = Customer.create({
    firstName: input.data.first_name,
    lastName: input.data.last_name,
    email,
    phone,
    notes: input.data.notes ?? null,
  });
  if (!created.ok) return created;

  const saved = await deps.customers.save(input.organizationId, created.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(created.value);
};

export const createCustomerAction = {
  execute: createCustomer,
} as const;
