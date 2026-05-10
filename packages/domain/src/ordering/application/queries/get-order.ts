import type { Dish } from "../../../catalog/domain/entities/dish.js";
import type { DishRepository } from "../../../catalog/domain/repositories/dish.repository.js";
import { toDishId } from "../../../catalog/domain/value-objects/dish-id.js";
import type { Customer } from "../../../customer/domain/entities/customer.js";
import type { CustomerRepository } from "../../../customer/domain/repositories/customer.repository.js";
import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Order } from "../../domain/entities/order.js";
import type { OrderLine } from "../../domain/entities/order-line.js";
import type { OrderRepository } from "../../domain/repositories/order.repository.js";
import type { OrderId } from "../../domain/value-objects/order-id.js";

export interface GetOrderDeps {
  orders: OrderRepository;
  customers: CustomerRepository;
  dishes: DishRepository;
}

export interface GetOrderResult {
  order: Order;
  customer: Customer | null;
  lines: OrderLine[];
  dishes: Dish[];
}

export const getOrder = async (
  input: { organizationId: string; restaurantId: string; id: OrderId },
  deps: GetOrderDeps,
): Promise<Result<GetOrderResult, DomainError>> => {
  const found = await deps.orders.findById(input.restaurantId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Order", input.id));

  const order = found.value;
  const lines = [...order.lines];

  const dishIds = Array.from(new Set(order.lines.map((l) => l.dishId))).map(toDishId);
  let dishes: Dish[] = [];
  if (dishIds.length > 0) {
    const d = await deps.dishes.findByIds(input.restaurantId, dishIds);
    if (!d.ok) return d;
    dishes = d.value;
  }

  let customer: Customer | null = null;
  if (order.customerId) {
    const c = await deps.customers.findById(input.organizationId, order.customerId);
    if (!c.ok) return c;
    customer = c.value ?? null;
  }

  return Ok({ order, customer, lines, dishes });
};

export const getOrderAction = {
  execute: getOrder,
} as const;
