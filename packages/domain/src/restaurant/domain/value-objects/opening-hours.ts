/**
 * OpeningHours VO. Per-day open/close times in HH:mm. Closed days = null.
 */

import { type DomainError, ValidationError } from "../../../shared-kernel/errors.js";
import { all, Err, Ok, type Result } from "../../../shared-kernel/result.js";

export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export const WEEKDAYS: readonly Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (hhmm: string): number => {
  const m = HHMM.exec(hhmm);
  if (!m) return -1;
  return Number(m[1]) * 60 + Number(m[2]);
};

export interface DayHours {
  readonly openAt: string; // HH:mm
  readonly closeAt: string; // HH:mm
}

export type WeekSchedule = Readonly<Record<Weekday, DayHours | null>>;

export class OpeningHours {
  private constructor(public readonly schedule: WeekSchedule) {}

  static create(schedule: Partial<WeekSchedule>): Result<OpeningHours, DomainError> {
    const checks = WEEKDAYS.map<Result<[Weekday, DayHours | null], DomainError>>((day) => {
      const hours = schedule[day] ?? null;
      if (hours === null) return Ok([day, null] as const);
      const open = toMinutes(hours.openAt);
      const close = toMinutes(hours.closeAt);
      if (open < 0 || close < 0) {
        return Err(new ValidationError(`Invalid HH:mm on ${day}`, { hours }));
      }
      if (close <= open) {
        return Err(new ValidationError(`closeAt must be after openAt on ${day}`, { hours }));
      }
      return Ok([day, { openAt: hours.openAt, closeAt: hours.closeAt }] as const);
    });

    const combined = all(checks);
    if (!combined.ok) return combined;

    const week = Object.fromEntries(combined.value) as WeekSchedule;
    return Ok(new OpeningHours(week));
  }

  forDay(day: Weekday): DayHours | null {
    return this.schedule[day];
  }
}
