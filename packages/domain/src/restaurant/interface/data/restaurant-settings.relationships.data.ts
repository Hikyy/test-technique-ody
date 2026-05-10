import { z } from 'zod';
import type { RestaurantSettings } from '../../domain/entities/restaurant-settings.js';

export const restaurantSettingsRelationshipsDataSchema = z.object({}).strict();

export type RestaurantSettingsRelationshipsData = z.infer<
  typeof restaurantSettingsRelationshipsDataSchema
>;

export const toRestaurantSettingsRelationshipsData = (
  _s: RestaurantSettings,
): RestaurantSettingsRelationshipsData => ({});
