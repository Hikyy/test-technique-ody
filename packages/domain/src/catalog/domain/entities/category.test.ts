import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../shared-kernel/errors.js";
import { Category } from "./category.js";

describe("Category", () => {
  it("creates with name and position", () => {
    const r = Category.create({ name: "Entrées", position: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("Entrées");
      expect(r.value.position).toBe(0);
    }
  });

  it("trims name", () => {
    const r = Category.create({ name: "   Desserts   ", position: 3 });
    if (!r.ok) throw new Error("setup");
    expect(r.value.name).toBe("Desserts");
  });

  it("rejects empty name", () => {
    const r = Category.create({ name: "   ", position: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects negative position", () => {
    const r = Category.create({ name: "Vins", position: -1 });
    expect(r.ok).toBe(false);
  });

  it("rejects non-integer position", () => {
    const r = Category.create({ name: "Vins", position: 1.5 });
    expect(r.ok).toBe(false);
  });

  it("rename updates name", () => {
    const r = Category.create({ name: "Vins", position: 4 });
    if (!r.ok) throw new Error("setup");
    const u = r.value.rename("Boissons");
    expect(u.ok).toBe(true);
    expect(r.value.name).toBe("Boissons");
  });

  it("reorder updates position", () => {
    const r = Category.create({ name: "Vins", position: 4 });
    if (!r.ok) throw new Error("setup");
    const u = r.value.reorder(2);
    expect(u.ok).toBe(true);
    expect(r.value.position).toBe(2);
  });
});
