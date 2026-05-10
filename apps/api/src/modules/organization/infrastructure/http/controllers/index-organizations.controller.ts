import { OrganizationData } from "@ody/domain/organization";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { organizationRepository } from "../../persistence/drizzle-organization.repository.js";

export const IndexOrganizationsController = {
  tag: "organizations",
  summary: "List organizations the current user belongs to",
  response: { collection: OrganizationData.schema, description: "Organizations" },

  async __invoke({ context }) {
    const result = await organizationRepository.listForUser(context.var.user.id);

    if (!result.ok) return result;

    return { items: OrganizationData.collect(result.value) };
  },
} satisfies ControllerSpec;
