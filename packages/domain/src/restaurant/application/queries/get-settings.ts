import { type DomainError, NotFoundError } from "../../../shared-kernel/errors.js";
import { Err, Ok, type Result } from "../../../shared-kernel/result.js";
import type { RestaurantSettings } from "../../domain/entities/restaurant-settings.js";
import type { SettingsRepository } from "../../domain/repositories/settings.repository.js";

export interface GetSettingsDeps {
  settings: SettingsRepository;
}

export const getSettings = async (
  input: { restaurantId: string },
  deps: GetSettingsDeps,
): Promise<Result<RestaurantSettings, DomainError>> => {
  const r = await deps.settings.get(input.restaurantId);
  if (!r.ok) return r;
  if (!r.value) return Err(new NotFoundError("RestaurantSettings", input.restaurantId));
  return Ok(r.value);
};

export const getSettingsAction = {
  execute: getSettings,
} as const;
