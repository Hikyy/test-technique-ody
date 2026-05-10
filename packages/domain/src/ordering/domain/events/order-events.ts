/**
 * Domain events for Order. In-memory only — emitted into the aggregate's pending list,
 * the application layer drains them after `save()` (no event store, no bus persistence).
 */

import type { CustomerId } from "../../../customer/domain/value-objects/customer-id.js";
import type { OrderId } from "../value-objects/order-id.js";
import type { OrderStatusValue } from "../value-objects/order-status.js";

export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}

export interface OrderCreatedEvent extends DomainEvent {
  readonly type: "OrderCreated";
  readonly orderId: OrderId;
  readonly tableNumber: number;
  readonly customerId: CustomerId | null;
}

export interface OrderStatusChangedEvent extends DomainEvent {
  readonly type: "OrderStatusChanged";
  readonly orderId: OrderId;
  readonly from: OrderStatusValue;
  readonly to: OrderStatusValue;
}

export interface OrderCancelledEvent extends DomainEvent {
  readonly type: "OrderCancelled";
  readonly orderId: OrderId;
  readonly previousStatus: OrderStatusValue;
}

export type OrderDomainEvent = OrderCreatedEvent | OrderStatusChangedEvent | OrderCancelledEvent;
