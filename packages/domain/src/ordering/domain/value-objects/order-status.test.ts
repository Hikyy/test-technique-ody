import { describe, expect, it } from "vitest";
import { InvalidTransitionError, ValidationError } from "../../../shared-kernel/errors.js";
import { ORDER_STATUS_VALUES, OrderStatus, type OrderStatusValue } from "./order-status.js";

const all = ORDER_STATUS_VALUES;
const status = (v: OrderStatusValue): OrderStatus => {
  switch (v) {
    case "pending":
      return OrderStatus.pending;
    case "cooking":
      return OrderStatus.cooking;
    case "sent":
      return OrderStatus.sent;
    case "served":
      return OrderStatus.served;
    case "cancelled":
      return OrderStatus.cancelled;
  }
};

const validTransitions: ReadonlyArray<[OrderStatusValue, OrderStatusValue]> = [
  ["pending", "cooking"],
  ["pending", "cancelled"],
  ["cooking", "sent"],
  ["cooking", "cancelled"],
  ["sent", "served"],
  ["sent", "cancelled"],
];

describe("OrderStatus", () => {
  it("exposes 5 status values", () => {
    expect(ORDER_STATUS_VALUES).toEqual(["pending", "cooking", "sent", "served", "cancelled"]);
  });

  it("create accepts known values", () => {
    for (const v of all) {
      const r = OrderStatus.create(v);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value.value).toBe(v);
    }
  });

  it("create rejects unknown value", () => {
    const r = OrderStatus.create("weird");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("canTransitionTo returns true for valid transitions", () => {
    for (const [from, to] of validTransitions) {
      expect(status(from).canTransitionTo(status(to))).toBe(true);
    }
  });

  it("canTransitionTo returns false for invalid transitions", () => {
    const validSet = new Set(validTransitions.map(([a, b]) => `${a}>${b}`));
    for (const from of all) {
      for (const to of all) {
        if (from === to) continue;
        if (validSet.has(`${from}>${to}`)) continue;
        expect(status(from).canTransitionTo(status(to))).toBe(false);
      }
    }
  });

  it("transition Ok for valid pair", () => {
    const r = OrderStatus.pending.transition(OrderStatus.cooking);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("cooking");
  });

  it("transition Err for invalid pair", () => {
    const r = OrderStatus.pending.transition(OrderStatus.served);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(InvalidTransitionError);
  });

  it("transition to same status is Ok (no-op)", () => {
    const r = OrderStatus.cooking.transition(OrderStatus.cooking);
    expect(r.ok).toBe(true);
  });

  it("served and cancelled are terminal", () => {
    expect(OrderStatus.served.isTerminal()).toBe(true);
    expect(OrderStatus.cancelled.isTerminal()).toBe(true);
  });

  it("non-terminal states are not terminal", () => {
    expect(OrderStatus.pending.isTerminal()).toBe(false);
    expect(OrderStatus.cooking.isTerminal()).toBe(false);
    expect(OrderStatus.sent.isTerminal()).toBe(false);
  });

  it("terminal states cannot transition anywhere", () => {
    for (const to of all) {
      if (to === "served") continue;
      expect(OrderStatus.served.canTransitionTo(status(to))).toBe(false);
    }
    for (const to of all) {
      if (to === "cancelled") continue;
      expect(OrderStatus.cancelled.canTransitionTo(status(to))).toBe(false);
    }
  });

  it("equals compares values", () => {
    expect(OrderStatus.pending.equals(OrderStatus.pending)).toBe(true);
    expect(OrderStatus.pending.equals(OrderStatus.served)).toBe(false);
  });
});
