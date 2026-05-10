import { DishData, ListDishesFiltersDTO, listDishesAction } from "@ody/domain/catalog";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { PaginationQuery } from "../../../../../utils/pagination.js";
import { dishRepository } from "../../repositories.js";

export const IndexDishesController = {
  tag: "catalog",
  summary: "List dishes (filterable, paginated, searchable)",
  query: PaginationQuery.extend({
    category_id: z.string().min(1).optional(),
    available: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    search: z.string().trim().min(1).optional(),
  }),
  response: { collection: DishData.schema, description: "Dishes" },

  async __invoke({ query, context }) {
    const filters = ListDishesFiltersDTO.fromRequest(query);
    const result = await listDishesAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, filters },
      { dishes: dishRepository },
    );

    if (!result.ok) return result;

    return {
      items: DishData.collect(result.value.items),
      total: result.value.total,
      page: result.value.page,
      pageSize: result.value.pageSize,
    };
  },
} satisfies ControllerSpec;
