import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("invitations", "invitations_role_valid", { ifExists: true });
  pgm.addConstraint("invitations", "invitations_role_valid", {
    check: "role IN ('owner','manager','staff','admin','member')",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("invitations", "invitations_role_valid", { ifExists: true });
  pgm.addConstraint("invitations", "invitations_role_valid", {
    check: "role IN ('owner','manager','staff')",
  });
}
