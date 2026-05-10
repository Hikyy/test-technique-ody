import type { PagedResult } from "../../../customer/domain/repositories/customer.repository.js";
import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { Order } from "../entities/order.js";
import type { OrderId } from "../value-objects/order-id.js";
import type { OrderStatusValue } from "../value-objects/order-status.js";

export type OrderSearchScope = "table" | "dish" | "notes";

export interface ListOrdersOptions {
  restaurantId: string;
  status?: OrderStatusValue;
  from?: Date;
  to?: Date;
  search?: string;
  search_scope?: OrderSearchScope;
  page: number;
  pageSize: number;
}

export interface OrderRepository {
  findById(restaurantId: string, id: OrderId): Promise<Result<Order | null, DomainError>>;
  list(opts: ListOrdersOptions): Promise<Result<PagedResult<Order>, DomainError>>;
  save(restaurantId: string, order: Order): Promise<Result<void, DomainError>>;
}
