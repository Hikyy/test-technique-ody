import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("accounts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    account_id: { type: "text", notNull: true },
    provider_id: { type: "text", notNull: true },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
    access_token: { type: "text" },
    refresh_token: { type: "text" },
    id_token: { type: "text" },
    access_token_expires_at: { type: "timestamp with time zone" },
    refresh_token_expires_at: { type: "timestamp with time zone" },
    scope: { type: "text" },
    password: { type: "text" },
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
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("accounts");
}
