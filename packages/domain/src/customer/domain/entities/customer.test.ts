import { describe, expect, it } from "vitest";
import { Email } from "../../../shared-kernel/email.js";
import { ValidationError } from "../../../shared-kernel/errors.js";
import { Money } from "../../../shared-kernel/money.js";
import { PhoneNumber } from "../../../shared-kernel/phone-number.js";
import { Customer } from "./customer.js";

const email = (() => {
  const r = Email.create("alice@seve.fr");
  if (!r.ok) throw new Error("setup");
  return r.value;
})();
const phone = (() => {
  const r = PhoneNumber.create("0612345678");
  if (!r.ok) throw new Error("setup");
  return r.value;
})();

describe("Customer.create", () => {
  it("creates with email only", () => {
    const r = Customer.create({ firstName: "Alice", lastName: "Aubert", email });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.fullName).toBe("Alice Aubert");
      expect(r.value.email?.value).toBe("alice@seve.fr");
      expect(r.value.phone).toBeNull();
      expect(r.value.visitsCount).toBe(0);
      expect(r.value.spent.cents).toBe(0);
    }
  });

  it("creates with phone only", () => {
    const r = Customer.create({ firstName: "Alice", lastName: "Aubert", phone });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.phone?.value).toBe("+33612345678");
  });

  it("creates with both email and phone", () => {
    const r = Customer.create({ firstName: "A", lastName: "B", email, phone });
    expect(r.ok).toBe(true);
  });

  it("rejects when neither email nor phone provided", () => {
    const r = Customer.create({ firstName: "A", lastName: "B" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects empty firstName", () => {
    const r = Customer.create({ firstName: "   ", lastName: "B", email });
    expect(r.ok).toBe(false);
  });

  it("rejects too-long lastName", () => {
    const r = Customer.create({ firstName: "A", lastName: "x".repeat(81), email });
    expect(r.ok).toBe(false);
  });

  it("trims names", () => {
    const r = Customer.create({ firstName: "  Alice  ", lastName: "  Aubert  ", email });
    if (!r.ok) throw new Error("setup");
    expect(r.value.firstName).toBe("Alice");
    expect(r.value.lastName).toBe("Aubert");
  });
});

describe("Customer.recordVisit", () => {
  it("increments visit count and adds spend", () => {
    const r = Customer.create({ firstName: "A", lastName: "B", email });
    if (!r.ok) throw new Error("setup");
    r.value.recordVisit(Money.fromCents(2500));
    r.value.recordVisit(Money.fromCents(1500));
    expect(r.value.visitsCount).toBe(2);
    expect(r.value.spent.cents).toBe(4000);
  });
});

describe("Customer.update", () => {
  it("updates allowed fields", () => {
    const r = Customer.create({ firstName: "A", lastName: "B", email });
    if (!r.ok) throw new Error("setup");
    const u = r.value.update({ firstName: "Charlie", notes: "VIP" });
    expect(u.ok).toBe(true);
    expect(r.value.firstName).toBe("Charlie");
    expect(r.value.notes).toBe("VIP");
  });

  it("rejects update that drops both email and phone", () => {
    const r = Customer.create({ firstName: "A", lastName: "B", email });
    if (!r.ok) throw new Error("setup");
    const u = r.value.update({ email: null });
    expect(u.ok).toBe(false);
    if (!u.ok) expect(u.error).toBeInstanceOf(ValidationError);
  });

  it("allows swapping email for phone", () => {
    const r = Customer.create({ firstName: "A", lastName: "B", email });
    if (!r.ok) throw new Error("setup");
    const u = r.value.update({ email: null, phone });
    expect(u.ok).toBe(true);
    expect(r.value.phone?.value).toBe("+33612345678");
  });

  it("rejects invalid firstName in patch", () => {
    const r = Customer.create({ firstName: "A", lastName: "B", email });
    if (!r.ok) throw new Error("setup");
    const u = r.value.update({ firstName: "" });
    expect(u.ok).toBe(false);
  });
});
