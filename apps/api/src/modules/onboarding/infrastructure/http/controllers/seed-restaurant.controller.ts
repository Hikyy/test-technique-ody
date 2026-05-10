import { Ok } from "@ody/domain/shared-kernel";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { seedRestaurantAction } from "../../../application/seed-restaurant.action.js";

const seedScopeSchema = z.enum(["menu", "customers", "orders"]);

const SeedRestaurantRequestSchema = z.object({
  scopes: z.array(seedScopeSchema).min(1),
});

const SeedRestaurantResponseSchema = z.object({
  type: z.literal("onboarding-seed"),
  id: z.string(),
  attributes: z.object({
    inserted: z.object({
      categories: z.number().int().nonnegative(),
      dishes: z.number().int().nonnegative(),
      customers: z.number().int().nonnegative(),
      orders: z.number().int().nonnegative(),
      notifications: z.number().int().nonnegative(),
    }),
  }),
  relationships: z.object({}).strict(),
});

export const SeedRestaurantController = {
  tag: "onboarding",
  summary: "Generate sample data for the current restaurant (categories, dishes, customers, orders)",
  request: SeedRestaurantRequestSchema,
  response: { single: SeedRestaurantResponseSchema, description: "Inserted counts", status: 201 },

  async __invoke({ body, context }) {
    const result = await seedRestaurantAction.execute({
      organizationId: context.var.organization.organizationId,
      restaurantId: context.var.restaurant.restaurantId,
      scopes: body.scopes,
    });

    if (!result.ok) return result;

    return Ok({
      type: "onboarding-seed" as const,
      id: context.var.restaurant.restaurantId,
      attributes: { inserted: result.value.inserted },
      relationships: {},
    });
  },
} satisfies ControllerSpec;
