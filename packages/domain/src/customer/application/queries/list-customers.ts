import type { DomainError } from "../../../shared-kernel/errors.js";
import { Ok, type Result } from "../../../shared-kernel/result.js";
import type { Customer } from "../../domain/entities/customer.js";
import type { CustomerRepository } from "../../domain/repositories/customer.repository.js";
import type { ListCustomersFiltersDTO } from "../../interface/dto/customer.dto.js";

export interface ListCustomersDeps {
  customers: CustomerRepository;
}

export interface ListCustomersResult {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export const listCustomers = async (
  input: { organizationId: string; filters: ListCustomersFiltersDTO },
  deps: ListCustomersDeps,
): Promise<Result<ListCustomersResult, DomainError>> => {
  const r = await deps.customers.list({
    organizationId: input.organizationId,
    search: input.filters.search,
    search_scope: input.filters.search_scope,
    page: input.filters.page,
    pageSize: input.filters.pageSize,
  });
  if (!r.ok) return r;
  return Ok({
    items: r.value.items,
    total: r.value.total,
    page: r.value.page,
    pageSize: r.value.pageSize,
  });
};

export const listCustomersAction = {
  execute: listCustomers,
} as const;
