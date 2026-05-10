import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../shared-kernel/errors.js";
import { OpeningHours, WEEKDAYS } from "./opening-hours.js";

describe("OpeningHours", () => {
  it("creates a fully-closed schedule when given empty input", () => {
    const r = OpeningHours.create({});
    expect(r.ok).toBe(true);
    if (r.ok) {
      for (const d of WEEKDAYS) expect(r.value.forDay(d)).toBeNull();
    }
  });

  it("accepts valid HH:mm hours per day", () => {
    const r = OpeningHours.create({
      monday: { openAt: "09:00", closeAt: "23:30" },
      sunday: null,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.forDay("monday")).toEqual({ openAt: "09:00", closeAt: "23:30" });
      expect(r.value.forDay("sunday")).toBeNull();
    }
  });

  it("rejects malformed HH:mm", () => {
    const r = OpeningHours.create({
      monday: { openAt: "9:00", closeAt: "24:00" },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it("rejects close <= open", () => {
    const r = OpeningHours.create({
      monday: { openAt: "20:00", closeAt: "20:00" },
    });
    expect(r.ok).toBe(false);
  });

  it("rejects close before open", () => {
    const r = OpeningHours.create({
      tuesday: { openAt: "20:00", closeAt: "10:00" },
    });
    expect(r.ok).toBe(false);
  });

  it("accepts edge case 00:00 → 23:59", () => {
    const r = OpeningHours.create({
      friday: { openAt: "00:00", closeAt: "23:59" },
    });
    expect(r.ok).toBe(true);
  });
});
