import { toDishId } from "../../../catalog/domain/value-objects/dish-id.js";
import { toCustomerId } from "../../../customer/domain/value-objects/customer-id.js";
import type { Clock } from "../../../shared-kernel/clock.js";
import type { DomainError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import { Order } from "../../domain/entities/order.js";
import { OrderLine } from "../../domain/entities/order-line.js";
import type { OrderRepository } from "../../domain/repositories/order.repository.js";
import type { CreateOrderDTO } from "../../interface/dto/order.dto.js";

export interface CreateOrderDeps {
  orders: OrderRepository;
  clock: Clock;
}

export const createOrder = async (
  input: { restaurantId: string; data: CreateOrderDTO },
  deps: CreateOrderDeps,
): Promise<Result<Order, DomainError>> => {
  const lines: OrderLine[] = [];
  for (const l of input.data.lines) {
    const built = OrderLine.create({
      dishId: toDishId(l.dish_id),
      qty: l.qty,
      unitPrice: Money.fromCents(l.unit_price_cents),
      notes: l.notes ?? null,
    });
    if (!built.ok) return built;
    lines.push(built.value);
  }

  const created = Order.create({
    tableNumber: input.data.table_number,
    customerId: input.data.customer_id ? toCustomerId(input.data.customer_id) : null,
    scheduledAt: new Date(input.data.scheduled_at),
    lines,
    notes: input.data.notes ?? null,
    createdAt: deps.clock.now(),
  });
  if (!created.ok) return created;

  const saved = await deps.orders.save(input.restaurantId, created.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(created.value);
};

export const createOrderAction = {
  execute: createOrder,
} as const;
