/**
 * Order aggregate root.
 *
 * Invariants:
 *  - tableNumber ∈ [1..99]
 *  - lines.length ≥ 1 once status leaves `pending`
 *  - total = Σ lines.lineTotal()
 *  - status transitions follow OrderStatus graph
 */

import type { CustomerId } from "../../../customer/domain/value-objects/customer-id.js";
import type { Clock } from "../../../shared-kernel/clock.js";
import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { OrderDomainEvent } from "../events/order-events.js";
import { newOrderId, type OrderId, type OrderLineId } from "../value-objects/order-id.js";
import { OrderStatus } from "../value-objects/order-status.js";
import type { OrderLine } from "./order-line.js";

export interface OrderProps {
  id: OrderId;
  tableNumber: number;
  status: OrderStatus;
  customerId: CustomerId | null;
  scheduledAt: Date;
  lines: OrderLine[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  id?: OrderId;
  tableNumber: number;
  customerId?: CustomerId | null;
  scheduledAt: Date;
  lines: OrderLine[];
  notes?: string | null;
  createdAt?: Date;
}

const isValidTable = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= 99;

export class Order {
  private events: OrderDomainEvent[] = [];

  private constructor(private props: OrderProps) {}

  static create(input: CreateOrderInput): Result<Order, DomainError> {
    if (!isValidTable(input.tableNumber)) {
      return Err(new ValidationError("Order.tableNumber must be integer 1..99"));
    }
    if (input.lines.length < 1) {
      return Err(new ValidationError("Order requires at least one line"));
    }
    const now = input.createdAt ?? new Date();
    const order = new Order({
      id: input.id ?? newOrderId(),
      tableNumber: input.tableNumber,
      status: OrderStatus.pending,
      customerId: input.customerId ?? null,
      scheduledAt: input.scheduledAt,
      lines: [...input.lines],
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
    order.events.push({
      type: "OrderCreated",
      occurredAt: now,
      orderId: order.id,
      tableNumber: order.tableNumber,
      customerId: order.customerId,
    });
    return Ok(order);
  }

  static restore(props: OrderProps): Order {
    return new Order(props);
  }

  get id(): OrderId {
    return this.props.id;
  }
  get tableNumber(): number {
    return this.props.tableNumber;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get customerId(): CustomerId | null {
    return this.props.customerId;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  get lines(): ReadonlyArray<OrderLine> {
    return this.props.lines;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  total(): Money {
    const first = this.props.lines[0];

    if (!first) return Money.zero();

    return this.props.lines.reduce<Money>(
      (acc, line) => acc.add(line.lineTotal()),
      Money.zero(first.unitPrice.currency),
    );
  }

  changeStatus(next: OrderStatus, clock: Clock): Result<void, DomainError> {
    const transition = this.props.status.transition(next);
    if (!transition.ok) return transition;

    if (next.value !== "pending" && next.value !== "cancelled" && this.props.lines.length < 1) {
      return Err(new ValidationError("Order cannot leave pending without any line"));
    }

    const now = clock.now();
    const previous = this.props.status.value;
    this.props = { ...this.props, status: transition.value, updatedAt: now };

    this.events.push({
      type: "OrderStatusChanged",
      occurredAt: now,
      orderId: this.id,
      from: previous,
      to: transition.value.value,
    });
    if (transition.value.value === "cancelled") {
      this.events.push({
        type: "OrderCancelled",
        occurredAt: now,
        orderId: this.id,
        previousStatus: previous,
      });
    }
    return Ok(undefined);
  }

  addLine(line: OrderLine, clock: Clock): Result<void, DomainError> {
    if (this.props.status.isTerminal()) {
      return Err(new ValidationError("Cannot modify lines on a terminal order"));
    }
    this.props = {
      ...this.props,
      lines: [...this.props.lines, line],
      updatedAt: clock.now(),
    };
    return Ok(undefined);
  }

  removeLine(lineId: OrderLineId, clock: Clock): Result<void, DomainError> {
    if (this.props.status.isTerminal()) {
      return Err(new ValidationError("Cannot modify lines on a terminal order"));
    }
    const next = this.props.lines.filter((l) => l.id !== lineId);
    if (next.length === 0 && this.props.status.value !== "pending") {
      return Err(new ValidationError("Order must keep at least one line outside pending"));
    }
    this.props = { ...this.props, lines: next, updatedAt: clock.now() };
    return Ok(undefined);
  }

  pullEvents(): OrderDomainEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}
