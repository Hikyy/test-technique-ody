import { deleteDishAction, toDishId } from "@ody/domain/catalog";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { dishRepository } from "../../repositories.js";

export const DestroyDishController = {
  tag: "catalog",
  summary: "Delete a dish",
  params: z.object({ id: z.string().min(1) }),
  response: { noContent: true },

  async __invoke({ params, context }) {
    return deleteDishAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, id: toDishId(params.id) },
      { dishes: dishRepository },
    );
  },
} satisfies ControllerSpec;
