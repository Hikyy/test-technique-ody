import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

/**
 * Audit follow-ups (see db/AUDIT.md):
 *  - Active invitations: at most one pending invite per (restaurant, email).
 *  - Notifications data: must be a JSON object (defends jsonb against arrays/null).
 *  - Orders total_cents: non-negative.
 *  - Restaurants currency: ISO 4217 (3 chars).
 *
 * The customer-email partial unique index is intentionally NOT added here —
 * existing data may contain duplicates; that requires a one-shot dedup pass first.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS invitations_active_unique
      ON invitations (restaurant_id, lower(email))
      WHERE accepted_at IS NULL;
  `);

  pgm.addConstraint("notifications", "notifications_data_is_object", {
    check: "jsonb_typeof(data) = 'object'",
  });

  pgm.addConstraint("orders", "orders_total_cents_non_negative", {
    check: "total_cents >= 0",
  });

  pgm.addConstraint("restaurants", "restaurants_currency_iso4217", {
    check: "char_length(currency) = 3",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("restaurants", "restaurants_currency_iso4217", { ifExists: true });
  pgm.dropConstraint("orders", "orders_total_cents_non_negative", { ifExists: true });
  pgm.dropConstraint("notifications", "notifications_data_is_object", { ifExists: true });
  pgm.sql(`DROP INDEX IF EXISTS invitations_active_unique;`);
}
