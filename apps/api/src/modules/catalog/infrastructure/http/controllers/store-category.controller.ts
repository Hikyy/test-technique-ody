import { CategoryData, CreateCategoryDTO, CreateCategoryRequest, createCategoryAction } from "@ody/domain/catalog";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { categoryRepository } from "../../repositories.js";

export const StoreCategoryController = {
  tag: "catalog",
  summary: "Create a menu category",
  request: CreateCategoryRequest,
  response: { single: CategoryData.schema, status: 201, description: "Created" },

  async __invoke({ body, context }) {
    const data = CreateCategoryDTO.fromRequest(body);
    const category = await createCategoryAction.execute(
      { restaurantId: context.var.restaurant.restaurantId, data },
      { categories: categoryRepository },
    );

    if (!category.ok) return category;

    return CategoryData.fromModel(category.value);
  },
} satisfies ControllerSpec;
