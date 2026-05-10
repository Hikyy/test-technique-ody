import type { DomainError } from "../../../shared-kernel/errors.js";
import type { Result } from "../../../shared-kernel/result.js";
import type { RestaurantSettings } from "../entities/restaurant-settings.js";

export interface SettingsRepository {
  get(restaurantId: string): Promise<Result<RestaurantSettings | null, DomainError>>;
  save(restaurantId: string, settings: RestaurantSettings): Promise<Result<void, DomainError>>;
}
