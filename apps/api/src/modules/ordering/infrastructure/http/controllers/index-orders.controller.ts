import { DishData } from "@ody/domain/catalog";
import { CustomerData } from "@ody/domain/customer";
import {
  ListOrdersFiltersDTO,
  listOrdersAction,
  OrderData,
  orderIncludedSchema,
  orderSearchScopeSchema,
  orderStatusSchema,
  toOrderLineData,
} from "@ody/domain/ordering";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { PaginationQuery } from "../../../../../utils/pagination.js";
import { orderingDeps } from "../../repositories.js";

export const IndexOrdersController = {
  tag: "ordering",
  summary: "List orders (with included customers, lines, dishes)",
  query: PaginationQuery.extend({
    status: orderStatusSchema.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    search: z.string().trim().min(1).max(120).optional(),
    search_scope: orderSearchScopeSchema,
  }),
  response: {
    collection: OrderData.schema,
    included: orderIncludedSchema,
    description: "Orders",
  },

  async __invoke({ query, context }) {
    const filters = ListOrdersFiltersDTO.fromRequest(query);
    const result = await listOrdersAction.execute(
      {
        organizationId: context.var.organization.organizationId,
        restaurantId: context.var.restaurant.restaurantId,
        filters,
      },
      orderingDeps,
    );

    if (!result.ok) return result;

    const included = [
      ...CustomerData.collect(result.value.includedCustomers),
      ...result.value.includedLines.map(toOrderLineData),
      ...DishData.collect(result.value.includedDishes),
    ];

    return {
      items: OrderData.collect(result.value.items),
      included,
      total: result.value.total,
      page: result.value.page,
      pageSize: result.value.pageSize,
    };
  },
} satisfies ControllerSpec;
