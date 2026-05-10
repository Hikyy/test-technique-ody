import { getSettingsAction, RestaurantSettingsData } from "@ody/domain/restaurant";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { settingsRepository } from "../../repositories.js";

export const ShowSettingsController = {
  tag: "restaurant",
  summary: "Get restaurant settings",
  response: { single: RestaurantSettingsData.schema, description: "Settings" },

  async __invoke({ context }) {
    const settings = await getSettingsAction.execute(
      { restaurantId: context.var.restaurant.restaurantId },
      { settings: settingsRepository },
    );

    if (!settings.ok) return settings;

    return RestaurantSettingsData.fromModel(settings.value);
  },
} satisfies ControllerSpec;
