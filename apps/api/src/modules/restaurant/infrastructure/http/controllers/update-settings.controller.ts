import {
  RestaurantSettingsData,
  UpdateSettingsDTO,
  UpdateSettingsRequest,
  updateSettingsAction,
} from "@ody/domain/restaurant";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { settingsRepository } from "../../repositories.js";

export const UpdateSettingsController = {
  tag: "restaurant",
  summary: "Update restaurant settings",
  request: UpdateSettingsRequest,
  response: { single: RestaurantSettingsData.schema, description: "Updated" },

  async __invoke({ body, context }) {
    const patch = UpdateSettingsDTO.fromRequest(body);
    const settings = await updateSettingsAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, patch },
      { settings: settingsRepository },
    );

    if (!settings.ok) return settings;

    return RestaurantSettingsData.fromModel(settings.value);
  },
} satisfies ControllerSpec;
