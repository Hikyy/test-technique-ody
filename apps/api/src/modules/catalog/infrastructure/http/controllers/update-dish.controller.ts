import { DishData, toDishId, UpdateDishDTO, UpdateDishRequest, updateDishAction } from "@ody/domain/catalog";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { dishRepository } from "../../repositories.js";

export const UpdateDishController = {
  tag: "catalog",
  summary: "Update a dish",
  params: z.object({ id: z.string().min(1) }),
  request: UpdateDishRequest,
  response: { single: DishData.schema, description: "Updated" },

  async __invoke({ params, body, context }) {
    const dto = UpdateDishDTO.fromRequest(body);
    const dish = await updateDishAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, id: toDishId(params.id), patch: dto },
      { dishes: dishRepository },
    );

    if (!dish.ok) return dish;

    return DishData.fromModel(dish.value);
  },
} satisfies ControllerSpec;
