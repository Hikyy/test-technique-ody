import { apiReference } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import type { AppEnv } from "./factory.js";

export const OPENAPI_DOC_CONFIG = {
  openapi: "3.1.0" as const,
  info: {
    title: "Sève API",
    version: "0.1.0",
    description: "REST API for the Sève restaurant SaaS.",
    contact: { name: "Sève", email: "tech@seve.fr" },
  },
  servers: [{ url: "/", description: "current host" }],
  tags: [
    { name: "auth", description: "Better Auth session management" },
    { name: "identity", description: "Users & sessions" },
    { name: "customers", description: "CRM" },
    { name: "catalog", description: "Menu, dishes, categories" },
    { name: "ordering", description: "Service orders" },
    { name: "restaurant", description: "Restaurant settings" },
    { name: "dashboard", description: "Read-model KPIs" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http" as const,
        scheme: "bearer",
        bearerFormat: "session",
      },
    },
  },
};

export function mountOpenApiDocs(app: Hono<AppEnv>): void {
  app.get("/openapi.json", openAPISpecs(app, { documentation: OPENAPI_DOC_CONFIG }));

  app.get(
    "/docs",
    apiReference({
      url: "/openapi.json",
      pageTitle: "Sève API – Reference",
      theme: "default",
    }),
  );
}
