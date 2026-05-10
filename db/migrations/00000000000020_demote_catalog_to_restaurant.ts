import type { MigrationBuilder } from "node-pg-migrate";

/**
 * Revert categories + dishes from per-organization to per-restaurant scope.
 * Customers stay per-organization (aggregated KPIs across the org's restaurants).
 *
 * Backfill strategy: each org's existing dishes/categories are assigned to the
 * org's *oldest* restaurant. Other restaurants will start with an empty menu —
 * which matches user expectation: a new restaurant has no menu until populated.
 */
export const up = async (pgm: MigrationBuilder): Promise<void> => {
  // ---- categories ----
  pgm.addColumns("categories", { restaurant_id: { type: "uuid" } });
  pgm.sql(`
    UPDATE categories c
    SET restaurant_id = r.id
    FROM (
      SELECT DISTINCT ON (organization_id) id, organization_id, created_at
      FROM restaurants
      ORDER BY organization_id, created_at ASC
    ) r
    WHERE r.organization_id = c.organization_id;
  `);
  pgm.alterColumn("categories", "restaurant_id", { notNull: true });
  pgm.addConstraint("categories", "categories_restaurant_id_fk", {
    foreignKeys: { columns: "restaurant_id", references: '"restaurants"', onDelete: "CASCADE" },
  });
  pgm.sql(`DROP INDEX IF EXISTS "categories_organization_position_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "categories_organization_id_idx";`);
  pgm.dropConstraint("categories", "categories_organization_id_fk", { ifExists: true });
  pgm.dropColumns("categories", ["organization_id"]);
  pgm.createIndex("categories", ["restaurant_id", "position"], { name: "categories_restaurant_position_idx" });
  pgm.createIndex("categories", "restaurant_id", { name: "categories_restaurant_id_idx" });

  // ---- dishes ----
  pgm.addColumns("dishes", { restaurant_id: { type: "uuid" } });
  pgm.sql(`
    UPDATE dishes d
    SET restaurant_id = r.id
    FROM (
      SELECT DISTINCT ON (organization_id) id, organization_id, created_at
      FROM restaurants
      ORDER BY organization_id, created_at ASC
    ) r
    WHERE r.organization_id = d.organization_id;
  `);
  pgm.alterColumn("dishes", "restaurant_id", { notNull: true });
  pgm.addConstraint("dishes", "dishes_restaurant_id_fk", {
    foreignKeys: { columns: "restaurant_id", references: '"restaurants"', onDelete: "CASCADE" },
  });
  pgm.sql(`DROP INDEX IF EXISTS "dishes_organization_category_available_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "dishes_organization_id_idx";`);
  pgm.dropConstraint("dishes", "dishes_organization_id_fk", { ifExists: true });
  pgm.dropColumns("dishes", ["organization_id"]);
  pgm.createIndex("dishes", ["restaurant_id", "category_id", "available"], {
    name: "dishes_restaurant_category_available_idx",
  });
  pgm.createIndex("dishes", "restaurant_id", { name: "dishes_restaurant_id_idx" });
};

export const down = async (): Promise<void> => {
  throw new Error("Migration 00000000000020_demote_catalog_to_restaurant is non-reversible.");
};
