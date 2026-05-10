import type { Clock } from "../../../shared-kernel/clock.js";
import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { Order } from "../../domain/entities/order.js";
import type { OrderRepository } from "../../domain/repositories/order.repository.js";
import type { OrderId } from "../../domain/value-objects/order-id.js";
import { OrderStatus } from "../../domain/value-objects/order-status.js";
import type { ChangeOrderStatusDTO } from "../../interface/dto/order.dto.js";

export interface ChangeOrderStatusDeps {
  orders: OrderRepository;
  clock: Clock;
}

export const changeOrderStatus = async (
  input: { restaurantId: string; id: OrderId; patch: ChangeOrderStatusDTO },
  deps: ChangeOrderStatusDeps,
): Promise<Result<Order, DomainError>> => {
  const found = await deps.orders.findById(input.restaurantId, input.id);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("Order", input.id));

  const next = OrderStatus.create(input.patch.status);
  if (!next.ok) return next;

  const transitioned = found.value.changeStatus(next.value, deps.clock);
  if (!transitioned.ok) return transitioned;

  const saved = await deps.orders.save(input.restaurantId, found.value);
  if (!saved.ok) return Err(saved.error);
  return Ok(found.value);
};

export const changeOrderStatusAction = {
  execute: changeOrderStatus,
} as const;
