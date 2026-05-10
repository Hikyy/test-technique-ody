/**
 * OrderStatus VO + transition graph.
 *
 *  pending → cooking → sent → served
 *      \________\______\____\__→ cancelled
 *
 * Encoded as a `Record<status, Set<status>>` lookup table; `canTransitionTo` is O(1)
 * and `transition` returns Result so application code never throws on bad input.
 */

import { type DomainError, InvalidTransitionError, ValidationError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";

export type OrderStatusValue = "pending" | "cooking" | "sent" | "served" | "cancelled";

export const ORDER_STATUS_VALUES: readonly OrderStatusValue[] = [
  "pending",
  "cooking",
  "sent",
  "served",
  "cancelled",
] as const;

const TRANSITIONS: Readonly<Record<OrderStatusValue, ReadonlyArray<OrderStatusValue>>> = {
  pending: ["cooking", "cancelled"],
  cooking: ["sent", "cancelled"],
  sent: ["served", "cancelled"],
  served: [],
  cancelled: [],
};

export class OrderStatus {
  private constructor(public readonly value: OrderStatusValue) {}

  static readonly pending = new OrderStatus("pending");
  static readonly cooking = new OrderStatus("cooking");
  static readonly sent = new OrderStatus("sent");
  static readonly served = new OrderStatus("served");
  static readonly cancelled = new OrderStatus("cancelled");

  static create(raw: string): Result<OrderStatus, DomainError> {
    if (!ORDER_STATUS_VALUES.includes(raw as OrderStatusValue)) {
      return Err(new ValidationError(`Invalid order status: ${raw}`));
    }
    return Ok(new OrderStatus(raw as OrderStatusValue));
  }

  canTransitionTo(next: OrderStatus): boolean {
    return TRANSITIONS[this.value].includes(next.value);
  }

  transition(next: OrderStatus): Result<OrderStatus, DomainError> {
    if (this.equals(next)) return Ok(this);
    if (!this.canTransitionTo(next)) {
      return Err(new InvalidTransitionError(this.value, next.value));
    }
    return Ok(next);
  }

  isTerminal(): boolean {
    return TRANSITIONS[this.value].length === 0;
  }

  equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }
}
