import { DishData, toDishId, toggleDishAvailabilityAction } from "@ody/domain/catalog";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { dishRepository } from "../../repositories.js";

export const ToggleDishAvailabilityController = {
  tag: "catalog",
  summary: "Toggle dish availability",
  params: z.object({ id: z.string().min(1) }),
  response: { single: DishData.schema, status: 200, description: "Toggled" },

  async __invoke({ params, context }) {
    const dish = await toggleDishAvailabilityAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, id: toDishId(params.id) },
      { dishes: dishRepository },
    );

    if (!dish.ok) return dish;

    return DishData.fromModel(dish.value);
  },
} satisfies ControllerSpec;
