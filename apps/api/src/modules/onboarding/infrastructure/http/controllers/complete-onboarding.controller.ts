import { Ok } from "@ody/domain/shared-kernel";
import { z } from "zod";
import type { ControllerSpec } from "../../../../../utils/controller.js";
import { completeOnboardingAction } from "../../../application/complete-onboarding.action.js";

const CompleteOnboardingResponseSchema = z.object({
  type: z.literal("onboarding-completion"),
  id: z.string(),
  attributes: z.object({
    onboarded_at: z.string().datetime(),
  }),
  relationships: z.object({}).strict(),
});

export const CompleteOnboardingController = {
  tag: "onboarding",
  summary: "Mark the current restaurant as onboarded",
  response: { single: CompleteOnboardingResponseSchema, description: "Completed", status: 200 },

  async __invoke({ context }) {
    const result = await completeOnboardingAction.execute(context.var.restaurant.restaurantId);

    if (!result.ok) return result;

    return Ok({
      type: "onboarding-completion" as const,
      id: context.var.restaurant.restaurantId,
      attributes: { onboarded_at: result.value.onboardedAt.toISOString() },
      relationships: {},
    });
  },
} satisfies ControllerSpec;
