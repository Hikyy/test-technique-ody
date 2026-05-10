import { serve } from "@hono/node-server";
import { closeDb } from "@ody/db/client";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./log.js";

async function bootstrap(): Promise<void> {
  const app = createApp();

  const server = serve({ fetch: app.fetch, port: config.API_PORT }, (info) => {
    logger.info({ port: info.port, env: config.NODE_ENV }, `Sève API listening on http://localhost:${info.port}`);
    logger.info(`Docs:  http://localhost:${info.port}/docs`);
    logger.info(`OpenAPI: http://localhost:${info.port}/openapi.json`);
  });

  let shuttingDown = false;

  const shutdown = (signal: string): void => {
    if (shuttingDown) return;

    shuttingDown = true;
    logger.info({ signal }, "shutting down");

    server.close(async (err) => {
      if (err) logger.warn({ err }, "error closing http server");

      try {
        await closeDb();
        logger.info("db pool closed");
      } catch (dbErr) {
        logger.error({ err: dbErr }, "error closing db pool");
      }

      process.exit(err ? 1 : 0);
    });

    // Per Node.js docs: call AFTER server.close() to drop keep-alive sockets so
    // the port is released immediately. Required for fast restarts (tsx watch).
    if ("closeAllConnections" in server) server.closeAllConnections();
  };

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, () => shutdown(sig));
  }
}

bootstrap().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
