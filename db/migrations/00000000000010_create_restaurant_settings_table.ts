import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("restaurant_settings", {
    id: { type: "text", primaryKey: true, notNull: true, default: "default" },
    name: { type: "text", notNull: true },
    address: { type: "text" },
    phone: { type: "text" },
    opening_hours_json: { type: "jsonb", notNull: true },
    notifications_json: { type: "jsonb", notNull: true },
    currency: { type: "text", notNull: true, default: "EUR" },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("restaurant_settings");
}
