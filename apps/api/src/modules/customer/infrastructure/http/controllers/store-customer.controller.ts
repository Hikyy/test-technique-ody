import { CreateCustomerDTO, CreateCustomerRequest, CustomerData, createCustomerAction } from "@ody/domain/customer";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { customerRepository } from "../../repositories.js";

export const StoreCustomerController = {
  tag: "customers",
  summary: "Create a customer",
  request: CreateCustomerRequest,
  response: { single: CustomerData.schema, status: 201, description: "Created" },

  async __invoke({ body, context }) {
    const data = CreateCustomerDTO.fromRequest(body);
    const customer = await createCustomerAction.execute(
      { organizationId: context.var.organization.organizationId, data },
      { customers: customerRepository },
    );

    if (!customer.ok) return customer;

    return CustomerData.fromModel(customer.value);
  },
} satisfies ControllerSpec;
