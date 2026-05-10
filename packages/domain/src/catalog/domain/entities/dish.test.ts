import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { newCategoryId } from "../value-objects/category-id.js";
import { Dish } from "./dish.js";

const categoryId = newCategoryId();
const price = Money.fromCents(2500);

describe("Dish.create", () => {
  it("creates with valid input and defaults", () => {
    const r = Dish.create({ categoryId, name: "Saint-Jacques", price });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("Saint-Jacques");
      expect(r.value.available).toBe(true);
      expect(r.value.description).toBeNull();
      expect(r.value.imageUrl).toBeNull();
    }
  });

  it("trims dish name", () => {
    const r = Dish.create({ categoryId, name: "  Pigeon  ", price });
    if (!r.ok) throw new Error("setup");
    expect(r.value.name).toBe("Pigeon");
  });

  it("rejects empty name", () => {
    const r = Dish.create({ categoryId, name: "   ", price });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects too-long name", () => {
    const r = Dish.create({ categoryId, name: "x".repeat(121), price });
    expect(r.ok).toBe(false);
  });
});

describe("Dish behaviors", () => {
  const make = () => {
    const r = Dish.create({ categoryId, name: "Plat", price });
    if (!r.ok) throw new Error("setup");
    return r.value;
  };

  it("toggleAvailability flips boolean", () => {
    const d = make();
    expect(d.available).toBe(true);
    d.toggleAvailability();
    expect(d.available).toBe(false);
    d.toggleAvailability();
    expect(d.available).toBe(true);
  });

  it("setAvailable sets explicitly", () => {
    const d = make();
    d.setAvailable(false);
    expect(d.available).toBe(false);
  });

  it("changePrice accepts non-negative price", () => {
    const d = make();
    const r = d.changePrice(Money.fromCents(3000));
    expect(r.ok).toBe(true);
    expect(d.price.cents).toBe(3000);
  });

  it("update renames and re-categorizes", () => {
    const d = make();
    const newCat = newCategoryId();
    const r = d.update({ name: "Renamed", categoryId: newCat });
    expect(r.ok).toBe(true);
    expect(d.name).toBe("Renamed");
    expect(d.categoryId).toBe(newCat);
  });

  it("update rejects invalid name", () => {
    const d = make();
    const r = d.update({ name: "" });
    expect(r.ok).toBe(false);
  });
});
