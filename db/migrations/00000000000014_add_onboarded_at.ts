import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

/**
 * Tracks whether a restaurant has completed the onboarding wizard.
 * Backfills existing restaurants (the legacy default + any pre-existing) as
 * already-onboarded so they skip the wizard.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("restaurants", {
    onboarded_at: { type: "timestamp with time zone" },
  });
  pgm.sql(`UPDATE restaurants SET onboarded_at = now() WHERE onboarded_at IS NULL;`);
  pgm.createIndex("restaurants", "onboarded_at", { name: "restaurants_onboarded_at_idx" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP INDEX IF EXISTS "restaurants_onboarded_at_idx";`);
  pgm.dropColumn("restaurants", "onboarded_at");
}
