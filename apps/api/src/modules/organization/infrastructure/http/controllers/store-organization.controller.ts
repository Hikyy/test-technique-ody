import { CreateOrganizationDTO, CreateOrganizationRequest, OrganizationData } from "@ody/domain/organization";
import { ConflictError, Err } from "@ody/domain/shared-kernel";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { organizationRepository } from "../../persistence/drizzle-organization.repository.js";

export const StoreOrganizationController = {
  tag: "organizations",
  summary: "Create a new organization owned by the current user",
  request: CreateOrganizationRequest,
  response: { single: OrganizationData.schema, status: 201, description: "Created" },

  async __invoke({ body, context }) {
    const existing = await organizationRepository.listForUser(context.var.user.id);

    if (!existing.ok) return existing;

    if (existing.value.some((o) => o.role === "owner")) {
      return Err(new ConflictError("User already owns an organization"));
    }

    const dto = CreateOrganizationDTO.fromRequest(body);
    const result = await organizationRepository.createForOwner(dto.name, context.var.user.id);

    if (!result.ok) return result;

    return OrganizationData.fromModel(result.value);
  },
} satisfies ControllerSpec;
