import { AsyncLocalStorage } from "node:async_hooks";
import { db } from "@ody/db/client";
import {
  invitations,
  type NotificationSettings,
  organizationMembers,
  organizations,
  restaurantMembers,
  restaurants,
} from "@ody/db/schema";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

type WeekScheduleJson = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  { openAt: string; closeAt: string } | null
>;

// Set by the invite-accept flow so the user.create.after hook skips restaurant creation.
export const provisioningContext = new AsyncLocalStorage<{ skipAutoRestaurant: boolean }>();

const DEFAULT_OPENING_HOURS: WeekScheduleJson = {
  monday: { openAt: "12:00", closeAt: "22:00" },
  tuesday: { openAt: "12:00", closeAt: "22:00" },
  wednesday: { openAt: "12:00", closeAt: "22:00" },
  thursday: { openAt: "12:00", closeAt: "22:00" },
  friday: { openAt: "12:00", closeAt: "23:00" },
  saturday: { openAt: "12:00", closeAt: "23:00" },
  sunday: null,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  newOrders: true,
  cancellations: true,
  dailyReport: true,
};

export async function provisionRestaurantForNewUser(
  userId: string,
  email: string,
  ownerName: string,
): Promise<{ restaurantId: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  return await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: restaurantMembers.id })
      .from(restaurantMembers)
      .where(eq(restaurantMembers.userId, userId))
      .limit(1);

    if (existing.length > 0) return null;

    const pending = await tx
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, normalizedEmail),
          isNull(invitations.acceptedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(invitations.createdAt))
      .limit(1);

    const invite = pending[0];

    // Phase 1: only restaurant-scoped invites are honoured here. Org-scoped invites
    // (restaurant_id NULL) are handled in a later phase.
    if (invite && invite.restaurantId) {
      await tx.insert(restaurantMembers).values({
        restaurantId: invite.restaurantId,
        userId,
        role: invite.role,
      });

      // Mirror as org-level member so requireOrganization resolves to this org.
      const [r] = await tx
        .select({ organizationId: restaurants.organizationId })
        .from(restaurants)
        .where(eq(restaurants.id, invite.restaurantId))
        .limit(1);

      if (r) {
        await tx
          .insert(organizationMembers)
          .values({
            organizationId: r.organizationId,
            userId,
            role: invite.role === "owner" ? "owner" : "member",
          })
          .onConflictDoNothing({ target: [organizationMembers.organizationId, organizationMembers.userId] });
      }

      await tx.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invite.id));

      return { restaurantId: invite.restaurantId };
    }

    const restaurantName = ownerName ? `${ownerName.split(" ")[0]} · Sève` : "Sève";

    const orgInserted = await tx
      .insert(organizations)
      .values({ name: restaurantName })
      .returning({ id: organizations.id });
    const org = orgInserted[0];

    if (!org) throw new Error("Failed to insert organization");

    const inserted = await tx
      .insert(restaurants)
      .values({
        organizationId: org.id,
        name: restaurantName,
        currency: "EUR",
        openingHoursJson: DEFAULT_OPENING_HOURS as unknown as never,
        notificationsJson: DEFAULT_NOTIFICATION_SETTINGS,
        onboardedAt: null,
      })
      .returning({ id: restaurants.id });

    const restaurant = inserted[0];

    if (!restaurant) throw new Error("Failed to insert restaurant");

    await tx.insert(organizationMembers).values({
      organizationId: org.id,
      userId,
      role: "owner",
    });

    await tx.insert(restaurantMembers).values({
      restaurantId: restaurant.id,
      userId,
      role: "owner",
    });

    return { restaurantId: restaurant.id };
  });
}

export const provisionFreshRestaurantForUser = (userId: string, ownerName: string) =>
  provisionRestaurantForNewUser(userId, "", ownerName);
