import type { MigrationBuilder } from "node-pg-migrate";

/**
 * Promotes catalog (categories, dishes) and customers from per-restaurant to per-organization.
 * Orders + notifications stay per-restaurant.
 *
 * Steps for each table:
 *   1. add nullable organization_id
 *   2. backfill via JOIN on restaurants.organization_id
 *   3. set NOT NULL + add FK + composite indexes
 *   4. drop old restaurant_id column (cascades old indexes)
 */
export const up = async (pgm: MigrationBuilder): Promise<void> => {
  // -------- customers --------
  pgm.addColumns("customers", { organization_id: { type: "uuid" } });
  pgm.sql(`
    UPDATE customers c
    SET organization_id = r.organization_id
    FROM restaurants r
    WHERE c.restaurant_id = r.id;
  `);
  pgm.alterColumn("customers", "organization_id", { notNull: true });
  pgm.addConstraint("customers", "customers_organization_id_fk", {
    foreignKeys: { columns: "organization_id", references: '"organizations"', onDelete: "CASCADE" },
  });
  pgm.sql(`DROP INDEX IF EXISTS "customers_restaurant_email_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "customers_restaurant_name_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "customers_restaurant_id_idx";`);
  pgm.sql(`ALTER TABLE customers DROP COLUMN restaurant_id;`);
  pgm.createIndex("customers", ["organization_id", "email"], { name: "customers_organization_email_idx" });
  pgm.createIndex("customers", ["organization_id", "last_name", "first_name"], { name: "customers_organization_name_idx" });
  pgm.createIndex("customers", "organization_id", { name: "customers_organization_id_idx" });

  // -------- categories --------
  pgm.addColumns("categories", { organization_id: { type: "uuid" } });
  pgm.sql(`
    UPDATE categories c
    SET organization_id = r.organization_id
    FROM restaurants r
    WHERE c.restaurant_id = r.id;
  `);
  // Deduplicate (organization_id, name) BEFORE constraints. Keep oldest.
  pgm.sql(`
    DELETE FROM categories c
    USING categories c2
    WHERE c.organization_id = c2.organization_id
      AND c.name = c2.name
      AND c.created_at > c2.created_at;
  `);
  pgm.alterColumn("categories", "organization_id", { notNull: true });
  pgm.addConstraint("categories", "categories_organization_id_fk", {
    foreignKeys: { columns: "organization_id", references: '"organizations"', onDelete: "CASCADE" },
  });
  pgm.sql(`DROP INDEX IF EXISTS "categories_restaurant_position_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "categories_restaurant_id_idx";`);
  pgm.sql(`ALTER TABLE categories DROP COLUMN restaurant_id;`);
  pgm.createIndex("categories", ["organization_id", "position"], { name: "categories_organization_position_idx" });
  pgm.createIndex("categories", "organization_id", { name: "categories_organization_id_idx" });

  // -------- dishes --------
  pgm.addColumns("dishes", { organization_id: { type: "uuid" } });
  pgm.sql(`
    UPDATE dishes d
    SET organization_id = r.organization_id
    FROM restaurants r
    WHERE d.restaurant_id = r.id;
  `);
  // Dedupe (org, name): keep oldest, but order_lines references dishes(id) so we
  // also need to repoint order_lines from removed dishes to surviving ones.
  pgm.sql(`
    WITH ranked AS (
      SELECT id, organization_id, name,
             FIRST_VALUE(id) OVER (PARTITION BY organization_id, name ORDER BY created_at) AS keeper_id
      FROM dishes
    )
    UPDATE order_lines ol
    SET dish_id = r.keeper_id
    FROM ranked r
    WHERE ol.dish_id = r.id AND r.id <> r.keeper_id;
  `);
  pgm.sql(`
    DELETE FROM dishes d
    USING dishes d2
    WHERE d.organization_id = d2.organization_id
      AND d.name = d2.name
      AND d.created_at > d2.created_at;
  `);
  pgm.alterColumn("dishes", "organization_id", { notNull: true });
  pgm.addConstraint("dishes", "dishes_organization_id_fk", {
    foreignKeys: { columns: "organization_id", references: '"organizations"', onDelete: "CASCADE" },
  });
  pgm.sql(`DROP INDEX IF EXISTS "dishes_restaurant_category_available_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "dishes_restaurant_id_idx";`);
  pgm.sql(`ALTER TABLE dishes DROP COLUMN restaurant_id;`);
  pgm.createIndex("dishes", ["organization_id", "category_id", "available"], { name: "dishes_organization_category_available_idx" });
  pgm.createIndex("dishes", "organization_id", { name: "dishes_organization_id_idx" });
};

export const down = async (): Promise<void> => {
  throw new Error("Migration 00000000000018_promote_to_organization is non-reversible (data shape change).");
};
