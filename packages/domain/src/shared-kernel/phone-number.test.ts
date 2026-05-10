import { describe, expect, it } from "vitest";
import { PhoneNumber } from "./phone-number.js";

describe("PhoneNumber", () => {
  it("accepts FR local format and converts to E.164", () => {
    const r = PhoneNumber.create("0612345678");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("+33612345678");
  });

  it("accepts FR local format with spaces", () => {
    const r = PhoneNumber.create("06 12 34 56 78");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("+33612345678");
  });

  it("accepts FR local format with dots and dashes", () => {
    const r = PhoneNumber.create("06.12-34.56-78");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("+33612345678");
  });

  it("accepts already E.164 FR", () => {
    const r = PhoneNumber.create("+33612345678");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe("+33612345678");
  });

  it("rejects empty string", () => {
    const r = PhoneNumber.create("");
    expect(r.ok).toBe(false);
  });

  it("rejects too-short number", () => {
    const r = PhoneNumber.create("06123");
    expect(r.ok).toBe(false);
  });

  it("rejects 0 followed by 0 (invalid leading)", () => {
    const r = PhoneNumber.create("0012345678");
    expect(r.ok).toBe(false);
  });

  it("rejects non-FR international number", () => {
    const r = PhoneNumber.create("+15551234567");
    expect(r.ok).toBe(false);
  });

  it("equals compares canonical values", () => {
    const a = PhoneNumber.create("06 12 34 56 78");
    const b = PhoneNumber.create("+33612345678");
    if (!a.ok || !b.ok) throw new Error("setup");
    expect(a.value.equals(b.value)).toBe(true);
  });

  it("toString returns canonical value", () => {
    const r = PhoneNumber.create("0612345678");
    if (!r.ok) throw new Error("setup");
    expect(r.value.toString()).toBe("+33612345678");
  });
});
