import { z } from "zod";
import type { RestaurantSettings } from "../../domain/entities/restaurant-settings.js";

const dayHoursSchema = z
  .object({
    open_at: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    close_at: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  })
  .nullable();

export const weekScheduleSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export const restaurantSettingsAttributesDataSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(240),
  phone: z.string().nullable(),
  contact_email: z.string().email().nullable(),
  opening_hours: weekScheduleSchema,
  notifications_enabled: z.boolean(),
  currency: z.literal("EUR"),
  updated_at: z.string().datetime(),
});

export type RestaurantSettingsAttributesData = z.infer<typeof restaurantSettingsAttributesDataSchema>;

const toDay = (day: { openAt: string; closeAt: string } | null): { open_at: string; close_at: string } | null =>
  day ? { open_at: day.openAt, close_at: day.closeAt } : null;

export const toRestaurantSettingsAttributesData = (s: RestaurantSettings): RestaurantSettingsAttributesData => ({
  name: s.name,
  address: s.address,
  phone: s.phone?.value ?? null,
  contact_email: s.contactEmail?.value ?? null,
  opening_hours: {
    monday: toDay(s.openingHours.schedule.monday),
    tuesday: toDay(s.openingHours.schedule.tuesday),
    wednesday: toDay(s.openingHours.schedule.wednesday),
    thursday: toDay(s.openingHours.schedule.thursday),
    friday: toDay(s.openingHours.schedule.friday),
    saturday: toDay(s.openingHours.schedule.saturday),
    sunday: toDay(s.openingHours.schedule.sunday),
  },
  notifications_enabled: s.notificationsEnabled,
  currency: "EUR",
  updated_at: s.updatedAt.toISOString(),
});
