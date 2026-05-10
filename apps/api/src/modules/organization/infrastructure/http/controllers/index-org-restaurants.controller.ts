import { RestaurantInOrgData } from "@ody/domain/organization";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { organizationRepository } from "../../persistence/drizzle-organization.repository.js";

export const IndexOrgRestaurantsController = {
  tag: "organizations",
  summary: "List restaurants in an organization (only those the user is a member of)",
  params: z.object({ organizationId: z.string().uuid() }),
  response: { collection: RestaurantInOrgData.schema, description: "Restaurants" },

  async __invoke({ params, context }) {
    if (params.organizationId !== context.var.organization.organizationId) {
      return { items: [] };
    }

    const result = await organizationRepository.listRestaurantsInOrg(params.organizationId, context.var.user.id);

    if (!result.ok) return result;

    return { items: RestaurantInOrgData.collect(result.value) };
  },
} satisfies ControllerSpec;
