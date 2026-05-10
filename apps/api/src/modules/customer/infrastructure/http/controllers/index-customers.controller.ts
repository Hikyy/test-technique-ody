import {
  CustomerData,
  customerSearchScopeSchema,
  ListCustomersFiltersDTO,
  listCustomersAction,
} from "@ody/domain/customer";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { PaginationQuery } from "../../../../../utils/pagination.js";
import { customerRepository } from "../../repositories.js";

export const IndexCustomersController = {
  tag: "customers",
  summary: "List customers (paginated, optionally searched)",
  query: PaginationQuery.extend({
    search: z.string().trim().min(1).max(120).optional(),
    search_scope: customerSearchScopeSchema,
  }),
  response: { collection: CustomerData.schema, description: "Paginated customer list" },

  async __invoke({ query, context }) {
    const filters = ListCustomersFiltersDTO.fromRequest(query);
    const result = await listCustomersAction.execute(
      { organizationId: context.var.organization.organizationId, filters },
      { customers: customerRepository },
    );

    if (!result.ok) return result;

    return {
      items: CustomerData.collect(result.value.items),
      total: result.value.total,
      page: result.value.page,
      pageSize: result.value.pageSize,
    };
  },
} satisfies ControllerSpec;
