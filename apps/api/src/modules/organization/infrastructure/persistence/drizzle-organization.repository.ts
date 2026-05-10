import { db } from "@ody/db/client";
import { organizationMembers, organizations, restaurantMembers, restaurants } from "@ody/db/schema";
import type { OrganizationModel, RestaurantInOrgModel } from "@ody/domain/organization";
import type { DomainError, Result } from "@ody/domain/shared-kernel";
import { and, asc, eq } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

export class DrizzleOrganizationRepository {
  listForUser(userId: string): Promise<Result<OrganizationModel[], DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
          role: organizationMembers.role,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
        .where(eq(organizationMembers.userId, userId))
        .orderBy(asc(organizationMembers.joinedAt));

      return rows.map(
        (r): OrganizationModel => ({
          id: r.id,
          name: r.name,
          role: r.role as OrganizationModel["role"],
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }),
      );
    });
  }

  createForOwner(name: string, ownerId: string): Promise<Result<OrganizationModel, DomainError>> {
    return runQuery(async () => {
      return await db.transaction(async (tx) => {
        const [org] = await tx
          .insert(organizations)
          .values({ name })
          .returning({ id: organizations.id, createdAt: organizations.createdAt, updatedAt: organizations.updatedAt });

        if (!org) throw new Error("Failed to insert organization");

        await tx.insert(organizationMembers).values({
          organizationId: org.id,
          userId: ownerId,
          role: "owner",
        });

        return {
          id: org.id,
          name,
          role: "owner" as const,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
        };
      });
    });
  }

  listRestaurantsInOrg(organizationId: string, userId: string): Promise<Result<RestaurantInOrgModel[], DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .selectDistinct({
          id: restaurants.id,
          organizationId: restaurants.organizationId,
          name: restaurants.name,
          createdAt: restaurants.createdAt,
        })
        .from(restaurants)
        .innerJoin(restaurantMembers, eq(restaurantMembers.restaurantId, restaurants.id))
        .where(and(eq(restaurants.organizationId, organizationId), eq(restaurantMembers.userId, userId)))
        .orderBy(asc(restaurants.createdAt));

      return rows;
    });
  }

  createRestaurantInOrg(
    organizationId: string,
    name: string,
    ownerId: string,
  ): Promise<Result<RestaurantInOrgModel, DomainError>> {
    return runQuery(async () => {
      return await db.transaction(async (tx) => {
        const [restaurant] = await tx
          .insert(restaurants)
          .values({
            organizationId,
            name,
            currency: "EUR",
            openingHoursJson: {} as never,
            notificationsJson: { newOrders: true, cancellations: true, dailyReport: true } as never,
            onboardedAt: new Date(),
          })
          .returning({
            id: restaurants.id,
            organizationId: restaurants.organizationId,
            name: restaurants.name,
            createdAt: restaurants.createdAt,
          });

        if (!restaurant) throw new Error("Failed to insert restaurant");

        await tx.insert(restaurantMembers).values({
          restaurantId: restaurant.id,
          userId: ownerId,
          role: "owner",
        });

        return restaurant;
      });
    });
  }
}

export const organizationRepository = new DrizzleOrganizationRepository();
