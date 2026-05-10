import {
  CustomerData,
  toCustomerId,
  UpdateCustomerDTO,
  UpdateCustomerRequest,
  updateCustomerAction,
} from "@ody/domain/customer";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { customerRepository } from "../../repositories.js";

export const UpdateCustomerController = {
  tag: "customers",
  summary: "Update a customer",
  params: z.object({ id: z.string().min(1) }),
  request: UpdateCustomerRequest,
  response: { single: CustomerData.schema, description: "Updated" },

  async __invoke({ params, body, context }) {
    const dto = UpdateCustomerDTO.fromRequest(body);
    const customer = await updateCustomerAction.execute(
      { organizationId: context.var.organization.organizationId, id: toCustomerId(params.id), patch: dto },
      { customers: customerRepository },
    );

    if (!customer.ok) return customer;

    return CustomerData.fromModel(customer.value);
  },
} satisfies ControllerSpec;
