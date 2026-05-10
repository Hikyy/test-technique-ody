import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import type { CustomerId } from "../../domain/value-objects/customer-id.js";

export interface DeleteCustomerDeps {
  customers: CustomerRepository;
}

export const deleteCustomer = (
  input: { organizationId: string; id: CustomerId },
  deps: DeleteCustomerDeps,
): Promise<Result<void, DomainError>> => deps.customers.delete(input.organizationId, input.id);

export const deleteCustomerAction = {
  execute: deleteCustomer,
} as const;
