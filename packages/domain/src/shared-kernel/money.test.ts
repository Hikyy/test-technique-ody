import { describe, expect, it } from "vitest";
import { InvariantViolation } from "./errors.js";
import { Money } from "./money.js";

describe("Money", () => {
  it("fromCents builds with EUR by default", () => {
    const m = Money.fromCents(1234);
    expect(m.cents).toBe(1234);
    expect(m.currency).toBe("EUR");
  });

  it("fromCents throws on non-integer", () => {
    expect(() => Money.fromCents(1.5)).toThrow(InvariantViolation);
  });

  it("fromCents throws on negative without allowNegative", () => {
    expect(() => Money.fromCents(-1)).toThrow(InvariantViolation);
  });

  it("fromCents allows negative when allowNegative=true", () => {
    const m = Money.fromCents(-100, "EUR", true);
    expect(m.cents).toBe(-100);
    expect(m.isNegative()).toBe(true);
  });

  it("fromEuros rounds to nearest cent", () => {
    expect(Money.fromEuros(12.345).cents).toBe(1235);
    expect(Money.fromEuros(12.344).cents).toBe(1234);
  });

  it("fromEuros throws on non-finite", () => {
    expect(() => Money.fromEuros(Number.NaN)).toThrow(InvariantViolation);
    expect(() => Money.fromEuros(Number.POSITIVE_INFINITY)).toThrow(InvariantViolation);
  });

  it("zero returns 0 in given currency", () => {
    expect(Money.zero("USD").cents).toBe(0);
    expect(Money.zero("USD").currency).toBe("USD");
  });

  it("add sums cents of same currency", () => {
    const a = Money.fromCents(100);
    const b = Money.fromCents(250);
    expect(a.add(b).cents).toBe(350);
  });

  it("add throws on currency mismatch", () => {
    expect(() => Money.fromCents(100, "EUR").add(Money.fromCents(100, "USD"))).toThrow(InvariantViolation);
  });

  it("subtract works and may go negative", () => {
    const r = Money.fromCents(100).subtract(Money.fromCents(250));
    expect(r.cents).toBe(-150);
    expect(r.isNegative()).toBe(true);
  });

  it("multiply scales cents and rounds", () => {
    expect(Money.fromCents(333).multiply(3).cents).toBe(999);
    expect(Money.fromCents(100).multiply(0.155).cents).toBe(16);
  });

  it("multiply throws on non-finite qty", () => {
    expect(() => Money.fromCents(100).multiply(Number.NaN)).toThrow(InvariantViolation);
  });

  it("toEuros converts cents to euro float", () => {
    expect(Money.fromCents(1234).toEuros()).toBeCloseTo(12.34);
  });

  it("equals compares cents and currency", () => {
    expect(Money.fromCents(100).equals(Money.fromCents(100))).toBe(true);
    expect(Money.fromCents(100).equals(Money.fromCents(101))).toBe(false);
    expect(Money.fromCents(100, "EUR").equals(Money.fromCents(100, "USD"))).toBe(false);
  });

  it("isZero detects zero", () => {
    expect(Money.zero().isZero()).toBe(true);
    expect(Money.fromCents(1).isZero()).toBe(false);
  });

  it("format returns a localized currency string", () => {
    const formatted = Money.fromCents(1234).format("fr-FR");
    expect(formatted).toMatch(/12,34/);
    expect(formatted).toMatch(/€/);
  });
});
