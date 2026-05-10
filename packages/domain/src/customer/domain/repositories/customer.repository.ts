import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { Customer } from "../entities/customer.js";
import type { CustomerId } from "../value-objects/customer-id.js";

export type CustomerSearchScope = "name" | "email" | "phone";

export interface ListCustomersOptions {
  organizationId: string;
  search?: string;
  search_scope?: CustomerSearchScope;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CustomerRepository {
  findById(organizationId: string, id: CustomerId): Promise<Result<Customer | null, DomainError>>;
  findByIds(organizationId: string, ids: CustomerId[]): Promise<Result<Customer[], DomainError>>;
  list(opts: ListCustomersOptions): Promise<Result<PagedResult<Customer>, DomainError>>;
  save(organizationId: string, customer: Customer): Promise<Result<void, DomainError>>;
  delete(organizationId: string, id: CustomerId): Promise<Result<void, DomainError>>;
}
