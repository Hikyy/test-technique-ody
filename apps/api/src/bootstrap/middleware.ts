import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { etag } from "hono/etag";
import { logger as honoLogger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";
import { config } from "../config.js";
import type { AppEnv } from "../factory.js";
import { logger } from "../log.js";
import { globalApiLimiter } from "../middleware/rate-limit.js";

const ONE_MB = 1 * 1024 * 1024;
const UPLOAD_HEADROOM = 4 * 1024 * 1024;

export function registerGlobalMiddleware(app: Hono<AppEnv>): void {
  app.use("*", trimTrailingSlash());
  app.use("*", requestId());
  app.use("*", contextStorage());

  app.use(
    "*",
    secureHeaders({
      xFrameOptions: "DENY",
      referrerPolicy: "strict-origin-when-cross-origin",
      xContentTypeOptions: "nosniff",
    }),
  );

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return null;

        return config.CORS_ORIGINS.includes(origin) ? origin : null;
      },
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization", "x-organization-id", "x-restaurant-id"],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      maxAge: 86400,
    }),
  );

  app.use("*", etag());
  app.use("*", compress());

  app.use(
    "*",
    honoLogger((msg, ...rest) => {
      logger.info({ rest }, msg);
    }),
  );

  app.use("*", async (c, next) => {
    await next();
    const reqId = c.get("requestId");

    if (reqId && c.res.status >= 400) {
      logger.info({ req_id: reqId, path: c.req.path, status: c.res.status }, "request completed");
    }
  });

  app.on(["POST", "PUT", "PATCH"], "/api/uploads/*", bodyLimit({ maxSize: UPLOAD_HEADROOM }));
  app.on(["POST", "PUT", "PATCH"], "*", bodyLimit({ maxSize: ONE_MB }));

  app.use("/api/*", globalApiLimiter);

  app.use(
    `${config.STORAGE_PUBLIC_PATH}/*`,
    serveStatic({ root: `./${config.STORAGE_DIR}`, rewriteRequestPath: stripStoragePrefix }),
  );
}

function stripStoragePrefix(path: string): string {
  return path.replace(new RegExp(`^${config.STORAGE_PUBLIC_PATH}`), "");
}
