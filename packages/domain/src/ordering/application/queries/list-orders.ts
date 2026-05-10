import type { Dish } from "../../../catalog/domain/entities/dish.js";
import type { DishRepository } from "../../../catalog/domain/repositories/dish.repository.js";
import { toDishId } from "../../../catalog/domain/value-objects/dish-id.js";
import type { Customer } from "../../../customer/domain/entities/customer.js";
import type { CustomerRepository } from "../../../customer/domain/repositories/customer.repository.js";
import { toCustomerId } from "../../../customer/domain/value-objects/customer-id.js";
import type { DomainError } from "../../../shared-kernel/errors.js";
import { Ok, type Result } from "../../../shared-kernel/result.js";
import type { Order } from "../../domain/entities/order.js";
import type { OrderLine } from "../../domain/entities/order-line.js";
import type { OrderRepository } from "../../domain/repositories/order.repository.js";
import type { ListOrdersFiltersDTO } from "../../interface/dto/order.dto.js";

export interface ListOrdersDeps {
  orders: OrderRepository;
  customers: CustomerRepository;
  dishes: DishRepository;
}

export interface ListOrdersResult {
  items: Order[];
  includedCustomers: Customer[];
  includedLines: OrderLine[];
  includedDishes: Dish[];
  total: number;
  page: number;
  pageSize: number;
}

export const listOrders = async (
  input: { organizationId: string; restaurantId: string; filters: ListOrdersFiltersDTO },
  deps: ListOrdersDeps,
): Promise<Result<ListOrdersResult, DomainError>> => {
  const r = await deps.orders.list({
    restaurantId: input.restaurantId,
    status: input.filters.status,
    from: input.filters.from ? new Date(input.filters.from) : undefined,
    to: input.filters.to ? new Date(input.filters.to) : undefined,
    search: input.filters.search,
    search_scope: input.filters.search_scope,
    page: input.filters.page,
    pageSize: input.filters.pageSize,
  });
  if (!r.ok) return r;

  const includedLines: OrderLine[] = [];
  const customerIdSet = new Set<string>();
  const dishIdSet = new Set<string>();

  for (const order of r.value.items) {
    if (order.customerId) customerIdSet.add(order.customerId);
    for (const line of order.lines) {
      includedLines.push(line);
      dishIdSet.add(line.dishId);
    }
  }

  let includedCustomers: Customer[] = [];
  if (customerIdSet.size > 0) {
    const ids = Array.from(customerIdSet).map(toCustomerId);
    const c = await deps.customers.findByIds(input.organizationId, ids);
    if (!c.ok) return c;
    includedCustomers = c.value;
  }

  let includedDishes: Dish[] = [];
  if (dishIdSet.size > 0) {
    const ids = Array.from(dishIdSet).map(toDishId);
    const d = await deps.dishes.findByIds(input.restaurantId, ids);
    if (!d.ok) return d;
    includedDishes = d.value;
  }

  return Ok({
    items: r.value.items,
    includedCustomers,
    includedLines,
    includedDishes,
    total: r.value.total,
    page: r.value.page,
    pageSize: r.value.pageSize,
  });
};

export const listOrdersAction = {
  execute: listOrders,
} as const;
