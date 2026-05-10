import { db } from "@ody/db/client";
import { restaurants } from "@ody/db/schema";
import { OpeningHours, RestaurantSettings, type SettingsRepository } from "@ody/domain/restaurant";
import { type DomainError, type Email, PhoneNumber, type Result } from "@ody/domain/shared-kernel";
import { eq } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

interface RestaurantRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  openingHoursJson: unknown;
  notificationsJson: unknown;
  currency: string;
  updatedAt: Date;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const LEGACY_DAY_KEYS: Record<string, (typeof WEEKDAYS)[number]> = {
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
  sun: "sunday",
};

// Accepts the canonical { monday: {openAt, closeAt} | null, ... } shape AND the
// legacy { mon: [{ open, close }], ... } seed shape. Unknown keys fall back to closed.
const normalizeOpeningHoursJson = (raw: unknown): Parameters<typeof OpeningHours.create>[0] => {
  const out: Record<string, { openAt: string; closeAt: string } | null> = {};

  if (!raw || typeof raw !== "object") return out;

  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const day = (WEEKDAYS as readonly string[]).includes(k) ? (k as (typeof WEEKDAYS)[number]) : LEGACY_DAY_KEYS[k];

    if (!day) continue;

    if (v === null) {
      out[day] = null;
      continue;
    }

    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as { openAt?: string; closeAt?: string };

      if (typeof o.openAt === "string" && typeof o.closeAt === "string") {
        out[day] = { openAt: o.openAt, closeAt: o.closeAt };
        continue;
      }
    }

    if (Array.isArray(v) && v.length > 0) {
      const first = v[0] as { open?: string; close?: string; closed?: boolean } | undefined;

      if (first?.closed === true) {
        out[day] = null;
        continue;
      }

      if (first && typeof first.open === "string" && typeof first.close === "string" && first.open !== first.close) {
        out[day] = { openAt: first.open, closeAt: first.close };
        continue;
      }
    }

    out[day] = null;
  }

  return out;
};

const rowToSettings = (row: RestaurantRow): RestaurantSettings | null => {
  let phoneVo: PhoneNumber | null = null;

  if (row.phone) {
    const r = PhoneNumber.create(row.phone);

    if (r.ok) phoneVo = r.value;
  }

  const oh = OpeningHours.create(normalizeOpeningHoursJson(row.openingHoursJson));

  if (!oh.ok) return null;

  const notifEnabled =
    typeof row.notificationsJson === "object" &&
    row.notificationsJson !== null &&
    "newOrders" in (row.notificationsJson as object)
      ? Boolean((row.notificationsJson as { newOrders?: boolean }).newOrders)
      : true;

  return RestaurantSettings.restore({
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    phone: phoneVo,
    contactEmail: null as Email | null,
    openingHours: oh.value,
    notificationsEnabled: notifEnabled,
    updatedAt: row.updatedAt,
  });
};

export class DrizzleRestaurantSettingsRepository implements SettingsRepository {
  get(restaurantId: string): Promise<Result<RestaurantSettings | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      const r = rows[0];

      return r ? rowToSettings(r as RestaurantRow) : null;
    });
  }

  save(restaurantId: string, settings: RestaurantSettings): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db
        .update(restaurants)
        .set({
          name: settings.name,
          address: settings.address || null,
          phone: settings.phone?.value ?? null,
          openingHoursJson: settings.openingHours.schedule as unknown as never,
          notificationsJson: {
            newOrders: settings.notificationsEnabled,
            cancellations: settings.notificationsEnabled,
            dailyReport: settings.notificationsEnabled,
          } as unknown as never,
          updatedAt: settings.updatedAt,
        })
        .where(eq(restaurants.id, restaurantId));
    });
  }
}

export const settingsRepository = new DrizzleRestaurantSettingsRepository();
