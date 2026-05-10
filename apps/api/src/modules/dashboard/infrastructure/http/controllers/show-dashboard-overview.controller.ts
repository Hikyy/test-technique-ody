import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { buildOverview, overviewSchema } from "../../../application/build-overview.js";

const dashboardType = "dashboard-overview" as const;
const dashboardId = "current" as const;

const dataSchema = z.object({
  type: z.literal(dashboardType),
  id: z.literal(dashboardId),
  attributes: overviewSchema,
  relationships: z.object({}).strict(),
});

export const ShowDashboardOverviewController = {
  tag: "dashboard",
  summary: "Aggregated KPIs for the home dashboard",
  errorSet: "minimal",
  response: { single: dataSchema, description: "Overview" },

  async __invoke({ context }) {
    const attributes = await buildOverview(new Date(), context.var.restaurant.restaurantId);

    return {
      type: dashboardType,
      id: dashboardId,
      attributes,
      relationships: {},
    };
  },
} satisfies ControllerSpec;
