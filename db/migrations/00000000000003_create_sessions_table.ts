import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("sessions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
      notNull: true,
    },
    expires_at: { type: "timestamp with time zone", notNull: true },
    token: { type: "text", notNull: true },
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
    ip_address: { type: "text" },
    user_agent: { type: "text" },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("sessions", "sessions_token_unique", { unique: ["token"] });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("sessions");
}
