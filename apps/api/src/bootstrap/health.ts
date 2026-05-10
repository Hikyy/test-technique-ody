import type { Hono } from "hono";
import { config } from "../config.js";
import type { AppEnv } from "../factory.js";

export function registerHealthRoute(app: Hono<AppEnv>): void {
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      env: config.NODE_ENV,
      ts: new Date().toISOString(),
    }),
  );
}
