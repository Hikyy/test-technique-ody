import { db } from "@ody/db/client";
import { organizationMembers, restaurantMembers, restaurants, users } from "@ody/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { factory, type MemberRole, type OrgMemberRole } from "../factory.js";
import { errorsBody } from "../utils/json-api.js";
import { type AuthSession, auth } from "./auth.js";

export type {
  AuthedSession,
  AuthedUser,
  AuthVariables,
  MemberRole,
  OrganizationContext,
  OrgMemberRole,
  RestaurantContext,
} from "../factory.js";

type SessionResult = NonNullable<AuthSession>;
type SessionUser = SessionResult["user"];
type SessionData = SessionResult["session"];

const unauthorizedResponse = (): Response =>
  Response.json(
    errorsBody([{ status: "401", code: "UNAUTHENTICATED", title: "Unauthorized", detail: "Authentication required" }]),
    { status: 401 },
  );

const forbiddenResponse = (detail = "Insufficient permissions"): Response =>
  Response.json(errorsBody([{ status: "403", code: "FORBIDDEN", title: "Forbidden", detail }]), { status: 403 });

const noOrganizationResponse = (): Response =>
  Response.json(
    errorsBody([
      { status: "403", code: "NO_ORGANIZATION", title: "No organization", detail: "User has no organization" },
    ]),
    { status: 403 },
  );

const noRestaurantResponse = (): Response =>
  Response.json(
    errorsBody([{ status: "403", code: "NO_RESTAURANT", title: "No restaurant", detail: "No accessible restaurant" }]),
    { status: 403 },
  );

export const requireAuth = factory.createMiddleware(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!result?.user || !result.session) {
    throw new HTTPException(401, { res: unauthorizedResponse() });
  }

  const u: SessionUser & { role?: string | null } = result.user;
  const s: SessionData = result.session;

  // Defensive: better-auth's cookieCache (5 min TTL) can hold a stale user_id
  // after a DB truncate or user deletion. Verify the user still exists, else
  // return 401 so the client re-authenticates (cookie cache discarded).
  const live = await db.select({ id: users.id }).from(users).where(eq(users.id, u.id)).limit(1);

  if (live.length === 0) {
    throw new HTTPException(401, { res: unauthorizedResponse() });
  }

  c.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    role: u.role ?? "staff",
  });
  c.set("session", {
    id: s.id,
    userId: s.userId,
    expiresAt: typeof s.expiresAt === "string" ? new Date(s.expiresAt) : s.expiresAt,
  });

  await next();
});

/**
 * Resolves the active organization. Picks the org from `x-organization-id` header
 * if the user is a member, else falls back to the user's oldest membership.
 * Must run after `requireAuth`.
 */
export const requireOrganization = factory.createMiddleware(async (c, next) => {
  const user = c.var.user;

  if (!user) {
    throw new HTTPException(401, { res: unauthorizedResponse() });
  }

  const requested = c.req.header("x-organization-id");

  if (requested) {
    const rows = await db
      .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
      .from(organizationMembers)
      .where(and(eq(organizationMembers.userId, user.id), eq(organizationMembers.organizationId, requested)))
      .limit(1);

    const m = rows[0];

    if (m) {
      c.set("organization", { organizationId: m.organizationId, role: m.role as OrgMemberRole });
      await next();

      return;
    }
  }

  const fallback = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, user.id))
    .orderBy(asc(organizationMembers.joinedAt))
    .limit(1);

  const m = fallback[0];

  if (!m) {
    throw new HTTPException(403, { res: noOrganizationResponse() });
  }

  c.set("organization", { organizationId: m.organizationId, role: m.role as OrgMemberRole });
  await next();
});

/**
 * Resolves the active restaurant within the active organization.
 * Picks from `x-restaurant-id` header if it belongs to the org AND the user has
 * a `restaurant_members` row for it. Otherwise falls back to the user's oldest
 * membership inside the active org.
 * Must run after `requireOrganization`.
 */
export const requireRestaurant = factory.createMiddleware(async (c, next) => {
  const user = c.var.user;
  const org = c.var.organization;

  if (!user || !org) {
    throw new HTTPException(401, { res: unauthorizedResponse() });
  }

  const requested = c.req.header("x-restaurant-id");

  if (requested) {
    const rows = await db
      .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
      .from(restaurantMembers)
      .innerJoin(restaurants, eq(restaurants.id, restaurantMembers.restaurantId))
      .where(
        and(
          eq(restaurantMembers.userId, user.id),
          eq(restaurantMembers.restaurantId, requested),
          eq(restaurants.organizationId, org.organizationId),
        ),
      )
      .limit(1);

    const m = rows[0];

    if (m) {
      c.set("restaurant", { restaurantId: m.restaurantId, role: m.role as MemberRole });
      await next();

      return;
    }
  }

  const fallback = await db
    .select({ restaurantId: restaurantMembers.restaurantId, role: restaurantMembers.role })
    .from(restaurantMembers)
    .innerJoin(restaurants, eq(restaurants.id, restaurantMembers.restaurantId))
    .where(and(eq(restaurantMembers.userId, user.id), eq(restaurants.organizationId, org.organizationId)))
    .orderBy(asc(restaurantMembers.joinedAt))
    .limit(1);

  const m = fallback[0];

  if (!m) {
    throw new HTTPException(403, { res: noRestaurantResponse() });
  }

  c.set("restaurant", { restaurantId: m.restaurantId, role: m.role as MemberRole });
  await next();
});

export const requireRole = (...roles: string[]) =>
  factory.createMiddleware(async (c, next) => {
    const user = c.var.user;

    if (!user || !roles.includes(user.role)) {
      throw new HTTPException(403, { res: forbiddenResponse() });
    }

    await next();
  });

export const requireMemberRole = (...roles: MemberRole[]) =>
  factory.createMiddleware(async (c, next) => {
    const restaurant = c.var.restaurant;

    if (!restaurant || !roles.includes(restaurant.role)) {
      throw new HTTPException(403, {
        res: forbiddenResponse(`Requires one of: ${roles.join(", ")}`),
      });
    }

    await next();
  });

export const requireOrgRole = (...roles: OrgMemberRole[]) =>
  factory.createMiddleware(async (c, next) => {
    const org = c.var.organization;

    if (!org || !roles.includes(org.role)) {
      throw new HTTPException(403, {
        res: forbiddenResponse(`Requires one of: ${roles.join(", ")}`),
      });
    }

    await next();
  });
