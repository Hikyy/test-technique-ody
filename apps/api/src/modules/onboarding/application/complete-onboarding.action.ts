import { db } from "@ody/db/client";
import { restaurants } from "@ody/db/schema";
import { Ok, type Result } from "@ody/domain/shared-kernel";
import { eq } from "drizzle-orm";

/**
 * Marks the restaurant as onboarded. Idempotent: re-runs are no-ops because
 * `onboardedAt` is only ever set forward.
 */
export async function completeOnboarding(restaurantId: string): Promise<Result<{ onboardedAt: Date }, never>> {
  const now = new Date();

  await db.update(restaurants).set({ onboardedAt: now }).where(eq(restaurants.id, restaurantId));

  return Ok({ onboardedAt: now });
}

export const completeOnboardingAction = {
  execute: completeOnboarding,
} as const;
