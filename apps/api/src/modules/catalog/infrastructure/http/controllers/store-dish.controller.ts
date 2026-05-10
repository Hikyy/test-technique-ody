import { CreateDishDTO, CreateDishRequest, createDishAction, DishData } from "@ody/domain/catalog";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { dishRepository } from "../../repositories.js";

export const StoreDishController = {
  tag: "catalog",
  summary: "Create a dish",
  request: CreateDishRequest,
  response: { single: DishData.schema, status: 201, description: "Created" },

  async __invoke({ body, context }) {
    const data = CreateDishDTO.fromRequest(body);
    const dish = await createDishAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, data },
      { dishes: dishRepository },
    );

    if (!dish.ok) return dish;

    return DishData.fromModel(dish.value);
  },
} satisfies ControllerSpec;
