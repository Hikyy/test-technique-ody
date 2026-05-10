import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("dishes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    category_id: {
      type: "uuid",
      notNull: true,
      references: '"categories"(id)',
      onDelete: "CASCADE",
    },
    name: { type: "text", notNull: true },
    description: { type: "text" },
    price_cents: { type: "integer", notNull: true },
    available: { type: "boolean", notNull: true, default: true },
    image_url: { type: "text" },
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

  pgm.addConstraint("dishes", "dishes_price_non_negative", {
    check: '"price_cents" >= 0',
  });

  pgm.createIndex("dishes", ["category_id", "available"], {
    name: "dishes_category_available_idx",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("dishes");
}
