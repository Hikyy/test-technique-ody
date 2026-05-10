import type { ErrorHandler, Hono, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../factory.js";
import { logger } from "../log.js";
import { type DomainErrorLike, domainErrorToJsonApi } from "../utils/result-to-http.js";

const notFoundHandler: NotFoundHandler<AppEnv> = (c) =>
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
  );

const onErrorHandler: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  const domainLike = err as DomainErrorLike;

  if (domainLike && (domainLike._tag || domainLike.name)) {
    const { status, body } = domainErrorToJsonApi(domainLike);

    if (status !== 500) {
      return c.json(body, status);
    }
  }

  logger.error({ err, path: c.req.path, req_id: c.get("requestId") }, "unhandled error");

  return c.json(
    {
      errors: [
        {
          status: "500",
          code: "INTERNAL_ERROR",
          title: "Internal Server Error",
        },
      ],
    },
    500,
  );
};

export function registerErrorHandlers(app: Hono<AppEnv>): void {
  app.notFound(notFoundHandler);
  app.onError(onErrorHandler);
}
