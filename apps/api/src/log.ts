import type { Context } from "hono";
import { tryGetContext } from "hono/context-storage";
import pino from "pino";
import { config, isDev } from "./config.js";
import type { AppEnv } from "./factory.js";

export const logger = pino({
  level: config.LOG_LEVEL,
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export type Logger = typeof logger;

export function loggerFor(c?: Context<AppEnv>): Logger {
  const ctx = c ?? tryGetContext<AppEnv>();

  if (!ctx) return logger;

  const reqId = ctx.get("requestId");

  return reqId ? logger.child({ req_id: reqId }) : logger;
}
