import { expo } from "@better-auth/expo";
import { db } from "@ody/db/client";
import * as schema from "@ody/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { config } from "../config.js";
import { logger } from "../log.js";
import { provisioningContext, provisionRestaurantForNewUser } from "./provisioning.js";

export const auth = betterAuth({
  appName: "Sève",
  baseURL: config.AUTH_URL,
  secret: config.AUTH_SECRET,
  trustedOrigins: [...config.CORS_ORIGINS, "seve://", "exp://"],
  plugins: [bearer(), expo()],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (provisioningContext.getStore()?.skipAutoRestaurant) return;

          try {
            await provisionRestaurantForNewUser(user.id, user.email ?? "", user.name ?? "");
          } catch (err) {
            logger.error({ err, userId: user.id }, "failed to provision restaurant for new user");
            throw err;
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "staff",
        input: false,
      },
    },
  },
  advanced: {
    cookiePrefix: "seve",
    useSecureCookies: config.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
});

export type Auth = typeof auth;
export type AuthSession = Awaited<ReturnType<Auth["api"]["getSession"]>>;
