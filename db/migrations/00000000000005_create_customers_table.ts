import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("customers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
    email: { type: "text" },
    phone: { type: "text" },
    notes: { type: "text" },
    visits_count: { type: "integer", notNull: true, default: 0 },
    spent_cents: { type: "integer", notNull: true, default: 0 },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("customers", "email", { name: "customers_email_idx" });
  pgm.createIndex("customers", ["last_name", "first_name"], {
    name: "customers_name_idx",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("customers");
}
