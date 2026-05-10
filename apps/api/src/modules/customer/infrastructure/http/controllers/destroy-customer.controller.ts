import { deleteCustomerAction, toCustomerId } from "@ody/domain/customer";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { customerRepository } from "../../repositories.js";

export const DestroyCustomerController = {
  tag: "customers",
  summary: "Delete a customer",
  params: z.object({ id: z.string().min(1) }),
  response: { noContent: true },

  async __invoke({ params, context }) {
    return deleteCustomerAction.execute(
      { organizationId: context.var.organization.organizationId, id: toCustomerId(params.id) },
      { customers: customerRepository },
    );
  },
} satisfies ControllerSpec;
