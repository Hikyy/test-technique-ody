import { DishData } from "@ody/domain/catalog";
import { CustomerData } from "@ody/domain/customer";
import { getOrderAction, OrderData, orderIncludedSchema, toOrderId, toOrderLineData } from "@ody/domain/ordering";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { orderingDeps } from "../../repositories.js";

export const ShowOrderController = {
  tag: "ordering",
  summary: "Get an order (with included customer, lines, dishes)",
  params: z.object({ id: z.string().min(1) }),
  response: {
    single: OrderData.schema,
    included: orderIncludedSchema,
    description: "Order",
  },

  async __invoke({ params, context }) {
    const result = await getOrderAction.execute(
      {
        organizationId: context.var.organization.organizationId,
        restaurantId: context.var.restaurant.restaurantId,
        id: toOrderId(params.id),
      },
      orderingDeps,
    );

    if (!result.ok) return result;

    const { order, customer, lines, dishes } = result.value;
    const included = [
      ...(customer ? [CustomerData.fromModel(customer)] : []),
      ...lines.map(toOrderLineData),
      ...DishData.collect(dishes),
    ];

    return { data: OrderData.fromModel(order), included };
  },
} satisfies ControllerSpec;
