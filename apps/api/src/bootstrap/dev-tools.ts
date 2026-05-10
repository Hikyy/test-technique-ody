import type { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { isDev } from "../config.js";
import type { AppEnv } from "../factory.js";

export function registerDevTools(app: Hono<AppEnv>): void {
  if (!isDev) return;

  showRoutes(app, { verbose: false, colorize: true });
}
