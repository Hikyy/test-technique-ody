import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("verifications", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    identifier: { type: "text", notNull: true },
    value: { type: "text", notNull: true },
    expires_at: { type: "timestamp with time zone", notNull: true },
    created_at: {
      type: "timestamp with time zone",
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamp with time zone",
      default: pgm.func("now()"),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("verifications");
}
