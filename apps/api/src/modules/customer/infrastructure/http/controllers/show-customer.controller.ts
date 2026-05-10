import { CustomerData, getCustomerAction, toCustomerId } from "@ody/domain/customer";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { customerRepository } from "../../repositories.js";

export const ShowCustomerController = {
  tag: "customers",
  summary: "Get a customer",
  params: z.object({ id: z.string().min(1) }),
  response: { single: CustomerData.schema, description: "Customer" },

  async __invoke({ params, context }) {
    const customer = await getCustomerAction.execute(
      { organizationId: context.var.organization.organizationId, id: toCustomerId(params.id) },
      { customers: customerRepository },
    );

    if (!customer.ok) return customer;

    return CustomerData.fromModel(customer.value);
  },
} satisfies ControllerSpec;
