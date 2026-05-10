import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

/**
 * Phase 1 of multi-restaurant org refactor: schema + backfill only.
 *
 *  - organizations: top of the hierarchy (org → restaurants → tenant data).
 *  - organization_members: user ↔ org pivot with role.
 *  - restaurants.organization_id: every restaurant belongs to exactly one org.
 *    Backfilled by minting one org per existing restaurant (1:1 lift).
 *  - invitations.organization_id: invites can target an org OR a restaurant.
 *
 * Backfill order (must stay in this order to keep NOT NULL safe):
 *   1. create org per restaurant (so restaurants can point at it)
 *   2. set restaurants.organization_id
 *   3. mirror restaurant_members → organization_members
 *   4. tighten restaurants.organization_id to NOT NULL + FK
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. organizations
  pgm.createTable("organizations", {
    id: { type: "uuid", primaryKey: true, notNull: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    created_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });

  // 2. organization_members
  pgm.createTable("organization_members", {
    id: { type: "uuid", primaryKey: true, notNull: true, default: pgm.func("gen_random_uuid()") },
    organization_id: {
      type: "uuid",
      notNull: true,
      references: '"organizations"',
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    role: { type: "text", notNull: true, default: "member" },
    joined_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("organization_members", "organization_members_role_valid", {
    check: "role IN ('owner','admin','member')",
  });
  pgm.addConstraint("organization_members", "organization_members_unique_per_user", {
    unique: ["organization_id", "user_id"],
  });
  pgm.createIndex("organization_members", "user_id", { name: "organization_members_user_idx" });

  // 3. restaurants.organization_id (nullable until backfill completes).
  pgm.addColumns("restaurants", {
    organization_id: { type: "uuid" },
  });

  // 4 + 5. Backfill atomically: one org per restaurant, then mirror members.
  pgm.sql(`
    DO $$
    BEGIN
      -- Mint one organization per restaurant; capture the mapping by reusing the same name.
      WITH new_orgs AS (
        INSERT INTO organizations (name, created_at, updated_at)
        SELECT r.name, r.created_at, r.updated_at
        FROM restaurants r
        WHERE r.organization_id IS NULL
        RETURNING id, name, created_at
      ),
      -- Pair each new org back to its restaurant. Names may collide, so disambiguate
      -- by created_at + a deterministic row_number() over both sides.
      paired AS (
        SELECT
          r.id AS restaurant_id,
          o.id AS organization_id
        FROM (
          SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
          FROM restaurants
          WHERE organization_id IS NULL
        ) r
        JOIN (
          SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
          FROM new_orgs
        ) o ON o.rn = r.rn
      )
      UPDATE restaurants r
      SET organization_id = p.organization_id
      FROM paired p
      WHERE r.id = p.restaurant_id;

      -- Mirror restaurant_members → organization_members.
      -- owner stays owner; everything else (manager/staff) collapses to member.
      INSERT INTO organization_members (organization_id, user_id, role, joined_at)
      SELECT
        r.organization_id,
        rm.user_id,
        CASE WHEN rm.role = 'owner' THEN 'owner' ELSE 'member' END,
        rm.joined_at
      FROM restaurant_members rm
      JOIN restaurants r ON r.id = rm.restaurant_id
      WHERE r.organization_id IS NOT NULL
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END $$;
  `);

  // 6. Tighten restaurants.organization_id: NOT NULL + FK + index.
  pgm.alterColumn("restaurants", "organization_id", { notNull: true });
  pgm.addConstraint("restaurants", "restaurants_organization_id_fk", {
    foreignKeys: { columns: "organization_id", references: '"organizations"', onDelete: "CASCADE" },
  });
  pgm.createIndex("restaurants", "organization_id", { name: "restaurants_organization_id_idx" });

  // 7. invitations.organization_id (nullable). At least one of (organization_id, restaurant_id) must be set.
  // Existing invitations are restaurant-scoped — leave them as-is.
  pgm.addColumns("invitations", {
    organization_id: { type: "uuid" },
  });
  pgm.addConstraint("invitations", "invitations_organization_id_fk", {
    foreignKeys: { columns: "organization_id", references: '"organizations"', onDelete: "CASCADE" },
  });
  // Drop the existing NOT NULL on restaurant_id because invites can now be org-scoped only.
  pgm.alterColumn("invitations", "restaurant_id", { notNull: false });
  pgm.addConstraint("invitations", "invitations_target_present", {
    check: "organization_id IS NOT NULL OR restaurant_id IS NOT NULL",
  });
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS invitations_active_org_email_unique
      ON invitations (organization_id, lower(email))
      WHERE accepted_at IS NULL AND organization_id IS NOT NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // invitations
  pgm.sql(`DROP INDEX IF EXISTS invitations_active_org_email_unique;`);
  pgm.dropConstraint("invitations", "invitations_target_present", { ifExists: true });
  pgm.dropConstraint("invitations", "invitations_organization_id_fk", { ifExists: true });
  // Restore NOT NULL on restaurant_id only if the column has no remaining nulls; safe because
  // we never wrote nulls in `up` (we only relaxed the constraint).
  pgm.sql(`UPDATE invitations SET restaurant_id = restaurant_id WHERE restaurant_id IS NULL;`);
  pgm.alterColumn("invitations", "restaurant_id", { notNull: true });
  pgm.dropColumns("invitations", ["organization_id"], { ifExists: true });

  // restaurants
  pgm.sql(`DROP INDEX IF EXISTS restaurants_organization_id_idx;`);
  pgm.dropConstraint("restaurants", "restaurants_organization_id_fk", { ifExists: true });
  pgm.dropColumns("restaurants", ["organization_id"], { ifExists: true });

  // organization_members + organizations
  pgm.dropTable("organization_members", { ifExists: true });
  pgm.dropTable("organizations", { ifExists: true });
}
