import type { Hono } from "hono";
import { mountBetterAuth } from "./auth/routes.js";
import { registerDevTools } from "./bootstrap/dev-tools.js";
import { registerErrorHandlers } from "./bootstrap/handlers.js";
import { registerHealthRoute } from "./bootstrap/health.js";
import { registerGlobalMiddleware } from "./bootstrap/middleware.js";
import { type AppEnv, factory } from "./factory.js";
import { mountAllModules } from "./modules/index.js";
import { mountOpenApiDocs } from "./openapi.js";

export type { AppEnv } from "./factory.js";

export function createApp(): Hono<AppEnv> {
  const app = factory.createApp();

  registerGlobalMiddleware(app);
  registerHealthRoute(app);

  mountAllModules(app);
  mountBetterAuth(app);
  mountOpenApiDocs(app);

  registerErrorHandlers(app);
  registerDevTools(app);

  return app;
}
