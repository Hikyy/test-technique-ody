import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("notifications", "body");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("notifications", { body: { type: "text" } });
}
