import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Customer } from "../../domain/entities/customer.js";
import type { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import type { CustomerId } from "../../domain/value-objects/customer-id.js";

export interface GetCustomerDeps {
  customers: CustomerRepository;
}

export const getCustomer = async (
  input: { organizationId: string; id: CustomerId },
  deps: GetCustomerDeps,
): Promise<Result<Customer, DomainError>> => {
  const found = await deps.customers.findById(input.organizationId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Customer", input.id));
  return Ok(found.value);
};

export const getCustomerAction = {
  execute: getCustomer,
} as const;
