import type { Email as EmailVO } from "../../../shared-kernel/email.js";
import { Email } from "../../../shared-kernel/email.js";
import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import type { PhoneNumber as PhoneVO } from "../../../shared-kernel/phone-number.js";
import { PhoneNumber } from "../../../shared-kernel/phone-number.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { RestaurantSettings } from "../../domain/entities/restaurant-settings.js";
import type { SettingsRepository } from "../../domain/repositories/settings.repository.js";
import { OpeningHours } from "../../domain/value-objects/opening-hours.js";
import type { UpdateSettingsDTO } from "../../interface/dto/settings.dto.js";

export interface UpdateSettingsDeps {
  settings: SettingsRepository;
}

export const updateSettings = async (
  input: { restaurantId: string; patch: UpdateSettingsDTO },
  deps: UpdateSettingsDeps,
): Promise<Result<RestaurantSettings, DomainError>> => {
  const found = await deps.settings.get(input.restaurantId);
  if (!found.ok) return found;
  if (!found.value) return Err(new NotFoundError("RestaurantSettings", input.restaurantId));
  const settings = found.value;
  const patch = input.patch;

  let phone: PhoneVO | null | undefined;
  if (patch.phone !== undefined) {
    if (patch.phone === null) phone = null;
    else {
      const r = PhoneNumber.create(patch.phone);
      if (!r.ok) return r;
      phone = r.value;
    }
  }
  let contactEmail: EmailVO | null | undefined;
  if (patch.contact_email !== undefined) {
    if (patch.contact_email === null) contactEmail = null;
    else {
      const r = Email.create(patch.contact_email);
      if (!r.ok) return r;
      contactEmail = r.value;
    }
  }
  let openingHours: OpeningHours | undefined;
  if (patch.opening_hours !== undefined) {
    const week = patch.opening_hours;
    const schedule = {
      monday: week.monday ? { openAt: week.monday.open_at, closeAt: week.monday.close_at } : null,
      tuesday: week.tuesday ? { openAt: week.tuesday.open_at, closeAt: week.tuesday.close_at } : null,
      wednesday: week.wednesday ? { openAt: week.wednesday.open_at, closeAt: week.wednesday.close_at } : null,
      thursday: week.thursday ? { openAt: week.thursday.open_at, closeAt: week.thursday.close_at } : null,
      friday: week.friday ? { openAt: week.friday.open_at, closeAt: week.friday.close_at } : null,
      saturday: week.saturday ? { openAt: week.saturday.open_at, closeAt: week.saturday.close_at } : null,
      sunday: week.sunday ? { openAt: week.sunday.open_at, closeAt: week.sunday.close_at } : null,
    };
    const r = OpeningHours.create(schedule);
    if (!r.ok) return r;
    openingHours = r.value;
  }

  const upd = settings.update({
    name: patch.name,
    address: patch.address,
    phone,
    contactEmail,
    openingHours,
    notificationsEnabled: patch.notifications_enabled,
  });
  if (!upd.ok) return upd;

  const saved = await deps.settings.save(input.restaurantId, settings);
  if (!saved.ok) return Err(saved.error);
  return Ok(settings);
};

export const updateSettingsAction = {
  execute: updateSettings,
} as const;
