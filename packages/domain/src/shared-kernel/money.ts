/**
 * Money value object — integer cents to avoid float drift. Currency-tagged.
 * Default EUR. Negative values rejected unless `allowNegative` flag used (e.g. refund delta).
 */

import { InvariantViolation } from "./errors.js";

export type Currency = "EUR" | "USD";

export class Money {
  private constructor(
    public readonly cents: number,
    public readonly currency: Currency,
  ) {}

  static fromCents(cents: number, currency: Currency = "EUR", allowNegative = false): Money {
    if (!Number.isInteger(cents)) {
      throw new InvariantViolation("Money.cents must be an integer", { cents });
    }
    if (!allowNegative && cents < 0) {
      throw new InvariantViolation("Money cannot be negative", { cents });
    }
    return new Money(cents, currency);
  }

  static fromEuros(euros: number, currency: Currency = "EUR", allowNegative = false): Money {
    if (!Number.isFinite(euros)) {
      throw new InvariantViolation("Money.euros must be finite", { euros });
    }
    const cents = Math.round(euros * 100);
    return Money.fromCents(cents, currency, allowNegative);
  }

  static zero(currency: Currency = "EUR"): Money {
    return new Money(0, currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new InvariantViolation("Currency mismatch", {
        a: this.currency,
        b: other.currency,
      });
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(this.cents + other.cents, this.currency, true);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(this.cents - other.cents, this.currency, true);
  }

  multiply(qty: number): Money {
    if (!Number.isFinite(qty)) {
      throw new InvariantViolation("Money.multiply qty must be finite", { qty });
    }
    return Money.fromCents(Math.round(this.cents * qty), this.currency, true);
  }

  toEuros(): number {
    return this.cents / 100;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  format(locale = "fr-FR"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
    }).format(this.toEuros());
  }
}
