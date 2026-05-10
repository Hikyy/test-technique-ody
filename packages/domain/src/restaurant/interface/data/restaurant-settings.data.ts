import { z } from 'zod';
import type { RestaurantSettings } from '../../domain/entities/restaurant-settings.js';
import {
  restaurantSettingsAttributesDataSchema,
  toRestaurantSettingsAttributesData,
} from './restaurant-settings.attributes.data.js';
import {
  restaurantSettingsRelationshipsDataSchema,
  toRestaurantSettingsRelationshipsData,
} from './restaurant-settings.relationships.data.js';

export const RESTAURANT_SETTINGS_RESOURCE_ID = 'current' as const;

export const restaurantSettingsDataSchema = z.object({
  type: z.literal('restaurant-settings'),
  id: z.literal(RESTAURANT_SETTINGS_RESOURCE_ID),
  attributes: restaurantSettingsAttributesDataSchema,
  relationships: restaurantSettingsRelationshipsDataSchema,
});

export type RestaurantSettingsData = z.infer<typeof restaurantSettingsDataSchema>;

export const toRestaurantSettingsData = (
  s: RestaurantSettings,
): RestaurantSettingsData => ({
  type: 'restaurant-settings',
  id: RESTAURANT_SETTINGS_RESOURCE_ID,
  attributes: toRestaurantSettingsAttributesData(s),
  relationships: toRestaurantSettingsRelationshipsData(s),
});

export const RestaurantSettingsData = {
  schema: restaurantSettingsDataSchema,
  fromModel: toRestaurantSettingsData,
} as const;
