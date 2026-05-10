import { eq } from "drizzle-orm";
import { closeDb, db } from "@ody/db/client";
import { users } from "@ody/db/schema";
import { auth } from "../src/auth/auth.js";

const CHEF_EMAIL = "chef@seve.fr";
const CHEF_PASSWORD = "seve2026";
const CHEF_NAME = "Léa Marchand";

async function main(): Promise<void> {
  const existing = await db.select().from(users).where(eq(users.email, CHEF_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log(`✓ chef already exists (${CHEF_EMAIL})`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email: CHEF_EMAIL, password: CHEF_PASSWORD, name: CHEF_NAME },
  });

  await db
    .update(users)
    .set({ emailVerified: true, role: "chef" })
    .where(eq(users.email, CHEF_EMAIL));

  console.log(`✓ chef created (${CHEF_EMAIL} / ${CHEF_PASSWORD})`);
}

main()
  .catch((err: unknown) => {
    console.error("seed-chef failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
