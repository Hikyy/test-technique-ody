import { CreateRestaurantInOrgDTO, CreateRestaurantInOrgRequest, RestaurantInOrgData } from "@ody/domain/organization";
import { Err, ValidationError } from "@ody/domain/shared-kernel";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { organizationRepository } from "../../persistence/drizzle-organization.repository.js";

export const StoreOrgRestaurantController = {
  tag: "organizations",
  summary: "Create a restaurant in the active organization (owner|admin only)",
  params: z.object({ organizationId: z.string().uuid() }),
  request: CreateRestaurantInOrgRequest,
  response: { single: RestaurantInOrgData.schema, status: 201, description: "Created" },

  async __invoke({ params, body, context }) {
    if (params.organizationId !== context.var.organization.organizationId) {
      return Err(new ValidationError("organizationId mismatch with active organization context"));
    }

    const dto = CreateRestaurantInOrgDTO.fromRequest(body);
    const result = await organizationRepository.createRestaurantInOrg(
      params.organizationId,
      dto.name,
      context.var.user.id,
    );

    if (!result.ok) return result;

    return RestaurantInOrgData.fromModel(result.value);
  },
} satisfies ControllerSpec;
