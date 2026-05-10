import { describe, expect, it } from "vitest";
import { isUuid, newId, toId } from "./id.js";

describe("Id", () => {
  it("newId generates a valid UUID string", () => {
    const id = newId<"Test">();
    expect(typeof id).toBe("string");
    expect(isUuid(id)).toBe(true);
  });

  it("newId generates unique values", () => {
    const a = newId<"Test">();
    const b = newId<"Test">();
    expect(a).not.toBe(b);
  });

  it("toId brands a raw string without validation", () => {
    const id = toId<"Test">("not-a-uuid");
    expect(id).toBe("not-a-uuid");
  });

  it("isUuid accepts canonical UUID", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("isUuid accepts uppercase UUID", () => {
    expect(isUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("isUuid rejects empty string", () => {
    expect(isUuid("")).toBe(false);
  });

  it("isUuid rejects malformed string", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("550e8400-e29b-41d4-a716")).toBe(false);
  });
});
