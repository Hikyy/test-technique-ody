import { createFactory } from "hono/factory";
import type { RequestIdVariables } from "hono/request-id";

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthedSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

export type MemberRole = "owner" | "manager" | "staff";
export type OrgMemberRole = "owner" | "admin" | "member";

export interface OrganizationContext {
  organizationId: string;
  role: OrgMemberRole;
}

export interface RestaurantContext {
  restaurantId: string;
  role: MemberRole;
}

export type AuthVariables = {
  user: AuthedUser;
  session: AuthedSession;
  organization: OrganizationContext;
  restaurant: RestaurantContext;
};

export type AppEnv = {
  Variables: AuthVariables & RequestIdVariables;
};

export const factory = createFactory<AppEnv>();

export const createMiddleware = factory.createMiddleware.bind(factory);
export const createHandlers = factory.createHandlers.bind(factory);
