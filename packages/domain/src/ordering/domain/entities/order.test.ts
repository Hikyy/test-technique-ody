import { describe, expect, it } from "vitest";
import { newDishId } from "../../../catalog/domain/value-objects/dish-id.js";
import { FixedClock } from "../../../shared-kernel/clock.js";
import { InvalidTransitionError, ValidationError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { OrderStatus } from "../value-objects/order-status.js";
import { Order } from "./order.js";
import { OrderLine } from "./order-line.js";

const makeLine = (qty = 2, cents = 1500): OrderLine => {
  const r = OrderLine.create({ dishId: newDishId(), qty, unitPrice: Money.fromCents(cents) });
  if (!r.ok) throw new Error("setup");
  return r.value;
};

const baseInput = () => ({
  tableNumber: 5,
  scheduledAt: new Date("2026-05-08T19:00:00Z"),
  lines: [makeLine()],
});

describe("Order.create", () => {
  it("creates a valid order in pending status", () => {
    const r = Order.create(baseInput());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status.value).toBe("pending");
      expect(r.value.tableNumber).toBe(5);
      expect(r.value.lines).toHaveLength(1);
    }
  });

  it("rejects when no lines are provided", () => {
    const r = Order.create({ ...baseInput(), lines: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects tableNumber < 1", () => {
    const r = Order.create({ ...baseInput(), tableNumber: 0 });
    expect(r.ok).toBe(false);
  });

  it("rejects tableNumber > 99", () => {
    const r = Order.create({ ...baseInput(), tableNumber: 100 });
    expect(r.ok).toBe(false);
  });

  it("rejects non-integer tableNumber", () => {
    const r = Order.create({ ...baseInput(), tableNumber: 5.5 });
    expect(r.ok).toBe(false);
  });

  it("emits an OrderCreated event", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    const events = r.value.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("OrderCreated");
  });
});

describe("Order.total", () => {
  it("sums lineTotals across lines", () => {
    const lines = [makeLine(2, 1000), makeLine(3, 500)];
    const r = Order.create({ ...baseInput(), lines });
    if (!r.ok) throw new Error("setup");
    expect(r.value.total().cents).toBe(2 * 1000 + 3 * 500);
  });

  it("returns zero for empty lines via restore", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    expect(r.value.total().cents).toBe(2 * 1500);
  });
});

describe("Order.changeStatus", () => {
  const clock = new FixedClock(new Date("2026-05-08T20:00:00Z"));

  it("transitions pending → cooking", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    r.value.pullEvents();
    const t = r.value.changeStatus(OrderStatus.cooking, clock);
    expect(t.ok).toBe(true);
    expect(r.value.status.value).toBe("cooking");
    const events = r.value.pullEvents();
    expect(events.find((e) => e.type === "OrderStatusChanged")).toBeDefined();
  });

  it("rejects invalid transition pending → served", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    const t = r.value.changeStatus(OrderStatus.served, clock);
    expect(t.ok).toBe(false);
    if (!t.ok) expect(t.error).toBeInstanceOf(InvalidTransitionError);
    expect(r.value.status.value).toBe("pending");
  });

  it("emits OrderCancelled when cancelled", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    r.value.pullEvents();
    const t = r.value.changeStatus(OrderStatus.cancelled, clock);
    expect(t.ok).toBe(true);
    const events = r.value.pullEvents();
    const cancelled = events.find((e) => e.type === "OrderCancelled");
    expect(cancelled).toBeDefined();
  });

  it("updates updatedAt to clock.now()", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    const before = r.value.updatedAt.getTime();
    const t = r.value.changeStatus(OrderStatus.cooking, clock);
    expect(t.ok).toBe(true);
    expect(r.value.updatedAt.getTime()).toBe(clock.now().getTime());
    expect(r.value.updatedAt.getTime()).not.toBe(before);
  });

  it("full happy path pending → cooking → sent → served", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    expect(r.value.changeStatus(OrderStatus.cooking, clock).ok).toBe(true);
    expect(r.value.changeStatus(OrderStatus.sent, clock).ok).toBe(true);
    expect(r.value.changeStatus(OrderStatus.served, clock).ok).toBe(true);
    expect(r.value.status.value).toBe("served");
  });

  it("cancel from any non-terminal status", () => {
    for (const start of ["cooking", "sent"] as const) {
      const r = Order.create(baseInput());
      if (!r.ok) throw new Error("setup");
      if (start === "cooking") {
        r.value.changeStatus(OrderStatus.cooking, clock);
      } else {
        r.value.changeStatus(OrderStatus.cooking, clock);
        r.value.changeStatus(OrderStatus.sent, clock);
      }
      const t = r.value.changeStatus(OrderStatus.cancelled, clock);
      expect(t.ok).toBe(true);
      expect(r.value.status.value).toBe("cancelled");
    }
  });
});

describe("Order.pullEvents", () => {
  it("drains and clears the event buffer", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    expect(r.value.pullEvents()).toHaveLength(1);
    expect(r.value.pullEvents()).toHaveLength(0);
  });
});

describe("Order.addLine / removeLine", () => {
  const clock = new FixedClock(new Date("2026-05-08T20:00:00Z"));

  it("addLine on a pending order works", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    const t = r.value.addLine(makeLine(1, 500), clock);
    expect(t.ok).toBe(true);
    expect(r.value.lines).toHaveLength(2);
  });

  it("addLine on a terminal order rejected", () => {
    const r = Order.create(baseInput());
    if (!r.ok) throw new Error("setup");
    r.value.changeStatus(OrderStatus.cancelled, clock);
    const t = r.value.addLine(makeLine(), clock);
    expect(t.ok).toBe(false);
  });
});
