# @ody/api — Sève API

Hono + Better Auth + Drizzle + zod-openapi REST API. DDD modules.

## Run

```bash
pnpm --filter @ody/api dev          # tsx watch on src/main.ts
pnpm --filter @ody/api build        # tsc → dist/
pnpm --filter @ody/api start        # node dist/main.js
pnpm --filter @ody/api typecheck    # tsc --noEmit
pnpm --filter @ody/api test         # vitest
```

## Env

Copy `.env.example` → `.env`. Required: `AUTH_SECRET`, Postgres `PG_*` (or `DATABASE_URL`).

## Endpoints

- `GET  /health`
- `*    /api/auth/*` — Better Auth
- `GET  /docs` — Scalar UI
- `GET  /openapi.json`
- `*    /api/v1/auth/me`, `/users/:id`
- `*    /api/v1/customers`, `/customers/:id`
- `*    /api/v1/menu/categories`, `/menu/dishes`
- `*    /api/v1/orders`, `/orders/:id`, `/orders/:id/status`, `/orders/:id/cancel`
- `*    /api/v1/settings`
- `GET  /api/v1/dashboard/overview`

## Middleware (auto-applied)

- `secureHeaders` — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict referrer policy.
- `compress` — gzip/brotli on responses (`Content-Encoding`, `Vary`).
- `etag` — automatic ETag on GET responses for client/proxy caching (304 on match).
- `requestId` — every request gets a unique `X-Request-ID` echoed in the response and injected into Pino logs as `req_id` for traceability.
- `bodyLimit` — POST/PUT/PATCH bodies capped at 1 MB.

## Rate limiting

Powered by [`hono-rate-limiter`](https://github.com/rhinobase/hono-rate-limiter). Limits are per-IP for unauthenticated routes (`x-forwarded-for` → `x-real-ip` → `127.0.0.1`) and per-user when a session is present. Standard `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers (IETF draft-6) are emitted; over-limit responses return HTTP 429 with `Retry-After` and a JSON:API `errors` body (`code: "RATE_LIMITED"`).

| Scope | Route(s) | Limit | Key |
|---|---|---|---|
| `loginLimiter` | `POST /api/auth/sign-in/email` | 5 / min | IP |
| `signUpLimiter` | `POST /api/auth/sign-up/email` | 3 / min | IP |
| `passwordLimiter` | `POST /api/auth/forget-password`, `POST /api/auth/reset-password` | 3 / min | IP |
| `globalApiLimiter` | `/api/v1/*` (all) | 100 / min | session → IP |
| `destroyLimiter` | `DELETE /api/v1/customers/:id`, `DELETE /api/v1/menu/dishes/:id`, `POST /api/v1/orders/:id/cancel` | 30 / min | session → IP |

Auth-route limiters must be registered before the Better Auth catch-all in `src/auth/routes.ts`. For multi-instance deployments, swap the in-memory store for a Redis-backed one via the `store` option of `rateLimiter`.

## Layout

```
src/
  app.ts main.ts config.ts log.ts openapi.ts factory.ts
  auth/        better-auth instance + session middleware
  middleware/  rate limiters
  utils/       json-api, pagination, error-responses, validator,
               result-to-http, event-bus
  routes/      per-context route registrars
  modules/<context>/{interface,application,infrastructure}
```

Routes (interface) → use cases (`@ody/domain`) → repos (infrastructure).

## Hono patterns

- **Factory** — `factory.createApp()` and `factory.createHandlers()` from
  `hono/factory`, configured with `AppEnv` (typed `Variables`) so every
  handler infers `c.get('user')`, `c.get('session')`, `c.get('requestId')`
  and validated payloads. See `docs/architecture.md`.
- **Controllers** — one file per endpoint, exporting
  `{ path, handlers }`. `handlers` is built with `factory.createHandlers(meta, zv(...), async (c) => ...)`
  where `meta` is `describeRoute({...})` from `hono-openapi`. Mounted
  from `routes/<ctx>.ts` via `app.get(controller.path, ...controller.handlers)`.
- **Validation** — `@hono/zod-validator` (`zv`) on `param`/`query`/`json`.
- **Error envelope** — JSON:API `errors[]` with `code`, `title`, `status`,
  `detail`. Domain errors mapped via `utils/result-to-http.ts`.
- **JSON:API + included** — `utils/json-api.ts` builds the envelope;
  `utils/pagination.ts` builds `meta.page` and `links`.
- **SSE** — `streamSSE` from `hono/streaming` in
  `modules/dashboard/.../stream-orders.controller.ts`, fed by the typed
  `eventBus` in `utils/event-bus.ts`.
- **Tests** — `vitest` + `app.request(...)` via `src/test/build-test-app.ts`
  (auth/rate-limit bypass + in-memory DB).
- **Codegen** — `@ody/types` is generated from `/openapi.json`.

## Further reading

- `docs/architecture.md` — DDD layout, middleware order rationale, JSON:API.
- `docs/hono-features-used.md` — exhaustive Hono inventory with doc links.
- `docs/improvements.md` — prioritised future Hono improvements.
