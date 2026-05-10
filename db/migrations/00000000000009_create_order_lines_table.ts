import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("order_lines", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: '"orders"(id)',
      onDelete: "CASCADE",
    },
    dish_id: {
      type: "uuid",
      notNull: true,
      references: '"dishes"(id)',
      onDelete: "RESTRICT",
    },
    qty: { type: "integer", notNull: true },
    unit_price_cents: { type: "integer", notNull: true },
    notes: { type: "text" },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("order_lines", "order_lines_qty_positive", {
    check: '"qty" > 0',
  });

  pgm.createIndex("order_lines", "order_id", { name: "order_lines_order_idx" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("order_lines");
}
