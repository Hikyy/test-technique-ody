import { CategoryData, listCategoriesAction } from "@ody/domain/catalog";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { categoryRepository } from "../../repositories.js";

export const IndexCategoriesController = {
  tag: "catalog",
  summary: "List menu categories",
  response: { collection: CategoryData.schema, description: "Categories" },

  async __invoke({ context }) {
    const result = await listCategoriesAction.execute(
      { restaurantId: context.var.restaurant.restaurantId },
      { categories: categoryRepository },
    );

    if (!result.ok) return result;

    return {
      items: CategoryData.collect(result.value.items),
      total: result.value.total,
      page: result.value.page,
      pageSize: result.value.pageSize,
    };
  },
} satisfies ControllerSpec;
