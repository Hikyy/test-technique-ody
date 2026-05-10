import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("notifications", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    type: { type: "text", notNull: true },
    title: { type: "text", notNull: true },
    body: { type: "text" },
    data: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    read_at: { type: "timestamp with time zone" },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("notifications", ["read_at", "created_at"], {
    name: "notifications_read_created_idx",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("notifications");
}
