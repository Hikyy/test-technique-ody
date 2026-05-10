import { Ok } from "@ody/domain/shared-kernel";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { showOnboardingStatusAction } from "../../../application/show-onboarding-status.action.js";

const OnboardingStatusSchema = z.object({
  type: z.literal("onboarding-status"),
  id: z.string(),
  attributes: z.object({
    restaurant_name: z.string(),
    onboarded_at: z.string().datetime().nullable(),
    counts: z.object({
      categories: z.number().int().nonnegative(),
      dishes: z.number().int().nonnegative(),
      customers: z.number().int().nonnegative(),
      orders: z.number().int().nonnegative(),
    }),
  }),
  relationships: z.object({}).strict(),
});

export const ShowOnboardingStatusController = {
  tag: "onboarding",
  summary: "Onboarding status for the current restaurant",
  response: { single: OnboardingStatusSchema, description: "Status" },

  async __invoke({ context }) {
    const result = await showOnboardingStatusAction.execute(context.var.restaurant.restaurantId);

    if (!result.ok) return result;

    const v = result.value;

    return Ok({
      type: "onboarding-status" as const,
      id: v.restaurantId,
      attributes: {
        restaurant_name: v.name,
        onboarded_at: v.onboardedAt ? v.onboardedAt.toISOString() : null,
        counts: v.counts,
      },
      relationships: {},
    });
  },
} satisfies ControllerSpec;
