import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("orders", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    table_number: { type: "integer", notNull: true },
    status: { type: "text", notNull: true },
    customer_id: {
      type: "uuid",
      references: '"customers"(id)',
      onDelete: "SET NULL",
    },
    scheduled_at: { type: "timestamp with time zone", notNull: true },
    total_cents: { type: "integer", notNull: true, default: 0 },
    notes: { type: "text" },
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

  pgm.addConstraint("orders", "orders_status_valid", {
    check: "\"status\" IN ('pending','cooking','sent','served','cancelled')",
  });

  pgm.createIndex("orders", ["status", "created_at"], {
    name: "orders_status_created_idx",
  });
  pgm.createIndex("orders", "customer_id", { name: "orders_customer_idx" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("orders");
}
