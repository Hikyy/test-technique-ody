import type { Clock } from "../../../shared-kernel/clock.js";
import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Order } from "../../domain/entities/order.js";
import type { OrderRepository } from "../../domain/repositories/order.repository.js";
import type { OrderId } from "../../domain/value-objects/order-id.js";
import { OrderStatus } from "../../domain/value-objects/order-status.js";

export interface CancelOrderDeps {
  orders: OrderRepository;
  clock: Clock;
}

export const cancelOrder = async (
  input: { restaurantId: string; id: OrderId },
  deps: CancelOrderDeps,
): Promise<Result<Order, DomainError>> => {
  const found = await deps.orders.findById(input.restaurantId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Order", input.id));

  const r = found.value.changeStatus(OrderStatus.cancelled, deps.clock);
  if (!r.ok) return r;

  const saved = await deps.orders.save(input.restaurantId, found.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(found.value);
};

export const cancelOrderAction = {
  execute: cancelOrder,
} as const;
