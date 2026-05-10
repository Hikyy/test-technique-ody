import { describe, expect, it } from "vitest";
import { newDishId } from "../../../catalog/domain/value-objects/dish-id.js";
import { ValidationError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { OrderLine } from "./order-line.js";

const dishId = newDishId();
const price = Money.fromCents(1500);

describe("OrderLine", () => {
  it("creates with valid input", () => {
    const r = OrderLine.create({ dishId, qty: 2, unitPrice: price });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.qty).toBe(2);
      expect(r.value.unitPrice.cents).toBe(1500);
      expect(r.value.notes).toBeNull();
    }
  });

  it("rejects qty < 1", () => {
    const r = OrderLine.create({ dishId, qty: 0, unitPrice: price });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects qty > 99", () => {
    const r = OrderLine.create({ dishId, qty: 100, unitPrice: price });
    expect(r.ok).toBe(false);
  });

  it("rejects non-integer qty", () => {
    const r = OrderLine.create({ dishId, qty: 1.5, unitPrice: price });
    expect(r.ok).toBe(false);
  });

  it("lineTotal multiplies unitPrice × qty", () => {
    const r = OrderLine.create({ dishId, qty: 3, unitPrice: Money.fromCents(1234) });
    if (!r.ok) throw new Error("setup");
    expect(r.value.lineTotal().cents).toBe(3702);
  });

  it("preserves notes when provided", () => {
    const r = OrderLine.create({ dishId, qty: 1, unitPrice: price, notes: "sans gluten" });
    if (!r.ok) throw new Error("setup");
    expect(r.value.notes).toBe("sans gluten");
  });
});
