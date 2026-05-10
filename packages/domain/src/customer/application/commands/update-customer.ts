import type { Email as EmailVO } from "../../../shared-kernel/email.js";
import { Email } from "../../../shared-kernel/email.js";
import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import type { PhoneNumber as PhoneVO } from "../../../shared-kernel/phone-number.js";
import { PhoneNumber } from "../../../shared-kernel/phone-number.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Customer } from "../../domain/entities/customer.js";
import type { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import type { CustomerId } from "../../domain/value-objects/customer-id.js";
import type { UpdateCustomerDTO } from "../../interface/dto/customer.dto.js";

export interface UpdateCustomerDeps {
  customers: CustomerRepository;
}

export const updateCustomer = async (
  input: { organizationId: string; id: CustomerId; patch: UpdateCustomerDTO },
  deps: UpdateCustomerDeps,
): Promise<Result<Customer, DomainError>> => {
  const found = await deps.customers.findById(input.organizationId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Customer", input.id));
  const customer = found.value;

  let email: EmailVO | null | undefined;
  if (input.patch.email !== undefined) {
    if (input.patch.email === null) email = null;
    else {
      const r = Email.create(input.patch.email);
      if (!r.ok) return r;
      email = r.value;
    }
  }
  let phone: PhoneVO | null | undefined;
  if (input.patch.phone !== undefined) {
    if (input.patch.phone === null) phone = null;
    else {
      const r = PhoneNumber.create(input.patch.phone);
      if (!r.ok) return r;
      phone = r.value;
    }
  }

  const upd = customer.update({
    firstName: input.patch.first_name,
    lastName: input.patch.last_name,
    email,
    phone,
    notes: input.patch.notes ?? undefined,
  });
  if (!upd.ok) return upd;

  const saved = await deps.customers.save(input.organizationId, customer);
  if (!saved.ok) return Err(saved.error);
  return Ok(customer);
};

export const updateCustomerAction = {
  execute: updateCustomer,
} as const;
