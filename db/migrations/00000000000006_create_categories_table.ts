import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("categories", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    name: { type: "text", notNull: true },
    position: { type: "integer", notNull: true, default: 0 },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("categories", "position", { name: "categories_position_idx" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("categories");
}
