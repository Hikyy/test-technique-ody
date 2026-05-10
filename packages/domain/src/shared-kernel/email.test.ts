import { describe, expect, it } from "vitest";
import { Email } from "./email.js";
import { ValidationError } from "./errors.js";

describe("Email", () => {
  it("accepts a valid email", () => {
    const r = Email.create("chef@seve.fr");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("chef@seve.fr");
  });

  it("lowercases the email", () => {
    const r = Email.create("Chef@SEVE.FR");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("chef@seve.fr");
  });

  it("trims surrounding whitespace", () => {
    const r = Email.create("   chef@seve.fr   ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("chef@seve.fr");
  });

  it("rejects empty string", () => {
    const r = Email.create("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects email without @", () => {
    const r = Email.create("not-an-email");
    expect(r.ok).toBe(false);
  });

  it("rejects email with spaces inside", () => {
    const r = Email.create("chef space@seve.fr");
    expect(r.ok).toBe(false);
  });

  it("rejects email with no TLD", () => {
    const r = Email.create("chef@seve");
    expect(r.ok).toBe(false);
  });

  it("rejects email longer than 254 chars", () => {
    const long = `${"a".repeat(250)}@x.fr`;
    const r = Email.create(long);
    expect(r.ok).toBe(false);
  });

  it("equals returns true for same value", () => {
    const a = Email.create("a@b.fr");
    const b = Email.create("A@B.FR");
    if (!a.ok || !b.ok) throw new Error("setup");
    expect(a.value.equals(b.value)).toBe(true);
  });

  it("equals returns false for different value", () => {
    const a = Email.create("a@b.fr");
    const b = Email.create("c@d.fr");
    if (!a.ok || !b.ok) throw new Error("setup");
    expect(a.value.equals(b.value)).toBe(false);
  });

  it("toString returns the canonical value", () => {
    const r = Email.create("Chef@Seve.FR");
    if (!r.ok) throw new Error("setup");
    expect(r.value.toString()).toBe("chef@seve.fr");
  });
});
