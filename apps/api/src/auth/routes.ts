import type { Hono } from "hono";
import type { AppEnv } from "../app.js";
import { loginLimiter, passwordLimiter, signUpLimiter } from "../middleware/rate-limit.js";
import { auth } from "./auth.js";

export function mountBetterAuth(app: Hono<AppEnv>): void {
  app.use("/api/auth/sign-in/email", loginLimiter);
  app.use("/api/auth/sign-up/email", signUpLimiter);
  app.use("/api/auth/forget-password", passwordLimiter);
  app.use("/api/auth/reset-password", passwordLimiter);

  app.on(["GET", "POST"], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  });
}
