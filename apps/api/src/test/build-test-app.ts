import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import type { AppEnv } from "../app.js";
import type { AuthedSession, AuthedUser, OrganizationContext, RestaurantContext } from "../auth/middleware.js";
import { type DomainErrorLike, domainErrorToJsonApi } from "../utils/result-to-http.js";

export interface TestAppOptions {
  user?: AuthedUser | null;
  session?: AuthedSession;
  organization?: OrganizationContext | null;
  restaurant?: RestaurantContext | null;
  register?: (app: Hono<AppEnv>) => void;
}

const defaultUser: AuthedUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "chef@example.com",
  name: "Test Chef",
  role: "chef",
};

const defaultSession: AuthedSession = {
  id: "00000000-0000-4000-8000-0000000000aa",
  userId: "00000000-0000-4000-8000-000000000001",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
};

export const TEST_RESTAURANT_ID = "00000000-0000-4000-8000-0000000000bb";
export const TEST_ORGANIZATION_ID = "00000000-0000-4000-8000-0000000000cc";

const defaultRestaurant: RestaurantContext = {
  restaurantId: TEST_RESTAURANT_ID,
  role: "owner",
};

const defaultOrganization: OrganizationContext = {
  organizationId: TEST_ORGANIZATION_ID,
  role: "owner",
};

export function buildTestApp(opts: TestAppOptions = {}): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  const userToInject = opts.user === undefined ? defaultUser : opts.user;
  const sessionToInject = opts.session ?? defaultSession;
  const organizationToInject = opts.organization === undefined ? defaultOrganization : opts.organization;
  const restaurantToInject = opts.restaurant === undefined ? defaultRestaurant : opts.restaurant;

  const inject: MiddlewareHandler<AppEnv> = async (c, next) => {
    if (userToInject) {
      c.set("user", userToInject);
      c.set("session", sessionToInject);
    }

    if (organizationToInject) {
      c.set("organization", organizationToInject);
    }

    if (restaurantToInject) {
      c.set("restaurant", restaurantToInject);
    }

    await next();
  };

  app.use("*", inject);

  app.get("/health", (c) => c.json({ status: "ok", env: "test", ts: new Date().toISOString() }));

  if (opts.register) opts.register(app);

  app.notFound((c) =>
    c.json(
      {
        errors: [
          {
            status: "404",
            code: "ROUTE_NOT_FOUND",
            title: "Not Found",
            detail: `Route ${c.req.path} not found`,
          },
        ],
      },
      404,
    ),
  );

  app.onError((err, c) => {
    const domainLike = err as unknown as DomainErrorLike;

    if (domainLike && (domainLike._tag || domainLike.name)) {
      const { status, body } = domainErrorToJsonApi(domainLike);

      if (status !== 500) {
        return c.json(body, status);
      }
    }

    return c.json(
      {
        errors: [
          {
            status: "500",
            code: "INTERNAL_ERROR",
            title: "Internal Server Error",
            detail: (err as Error).message,
          },
        ],
      },
      500,
    );
  });

  return app;
}
