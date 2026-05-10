import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

const TENANT_TABLES = ["customers", "categories", "dishes", "orders", "notifications"] as const;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. restaurants — owner-scoped tenant root.
  pgm.createTable("restaurants", {
    id: { type: "uuid", primaryKey: true, notNull: true, default: pgm.func("gen_random_uuid()") },
    name: { type: "text", notNull: true },
    address: { type: "text" },
    phone: { type: "text" },
    currency: { type: "text", notNull: true, default: "EUR" },
    opening_hours_json: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    notifications_json: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    created_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });

  // 2. restaurant_members — pivot: user ↔ restaurant with role.
  pgm.createTable("restaurant_members", {
    id: { type: "uuid", primaryKey: true, notNull: true, default: pgm.func("gen_random_uuid()") },
    restaurant_id: {
      type: "uuid",
      notNull: true,
      references: '"restaurants"',
      onDelete: "CASCADE",
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    role: { type: "text", notNull: true, default: "staff" },
    joined_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("restaurant_members", "restaurant_members_role_valid", {
    check: "role IN ('owner','manager','staff')",
  });
  pgm.addConstraint("restaurant_members", "restaurant_members_unique_per_user", {
    unique: ["restaurant_id", "user_id"],
  });
  pgm.createIndex("restaurant_members", "user_id", { name: "restaurant_members_user_idx" });

  // 3. invitations — secure token-based onboarding.
  pgm.createTable("invitations", {
    id: { type: "uuid", primaryKey: true, notNull: true, default: pgm.func("gen_random_uuid()") },
    restaurant_id: {
      type: "uuid",
      notNull: true,
      references: '"restaurants"',
      onDelete: "CASCADE",
    },
    email: { type: "text", notNull: true },
    role: { type: "text", notNull: true, default: "staff" },
    token_hash: { type: "text", notNull: true, unique: true },
    expires_at: { type: "timestamp with time zone", notNull: true },
    accepted_at: { type: "timestamp with time zone" },
    created_by: { type: "uuid", references: '"users"', onDelete: "SET NULL" },
    created_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("invitations", "invitations_role_valid", {
    check: "role IN ('owner','manager','staff')",
  });
  pgm.createIndex("invitations", ["restaurant_id", "email"], { name: "invitations_restaurant_email_idx" });
  pgm.createIndex("invitations", "expires_at", { name: "invitations_expires_idx" });

  // 4. Backfill: lift the legacy single-row restaurant_settings into a real restaurant tied
  //    to existing users. Idempotent: skips if no settings row exists.
  pgm.sql(`
    DO $$
    DECLARE
      v_restaurant_id uuid;
      v_settings_row record;
    BEGIN
      -- If legacy settings exist, materialize them as a restaurant.
      SELECT * INTO v_settings_row FROM restaurant_settings LIMIT 1;

      IF FOUND THEN
        INSERT INTO restaurants (name, address, phone, currency, opening_hours_json, notifications_json)
        VALUES (
          v_settings_row.name,
          v_settings_row.address,
          v_settings_row.phone,
          v_settings_row.currency,
          v_settings_row.opening_hours_json,
          v_settings_row.notifications_json
        )
        RETURNING id INTO v_restaurant_id;
      ELSIF EXISTS (SELECT 1 FROM customers UNION ALL SELECT 1 FROM categories UNION ALL SELECT 1 FROM orders) THEN
        -- Data exists without settings — synthesize a placeholder restaurant.
        INSERT INTO restaurants (name, currency, opening_hours_json, notifications_json)
        VALUES ('Sève', 'EUR', '{}'::jsonb, '{"newOrders":true,"cancellations":true,"dailyReport":true}'::jsonb)
        RETURNING id INTO v_restaurant_id;
      END IF;

      -- Make every existing user a member of that restaurant. The first becomes owner; others staff.
      IF v_restaurant_id IS NOT NULL THEN
        INSERT INTO restaurant_members (restaurant_id, user_id, role)
        SELECT
          v_restaurant_id,
          u.id,
          CASE WHEN row_number() OVER (ORDER BY u.created_at, u.id) = 1 THEN 'owner' ELSE 'staff' END
        FROM users u
        ON CONFLICT (restaurant_id, user_id) DO NOTHING;
      END IF;

      -- Stash the id for the column-add step below.
      PERFORM set_config('app.bootstrap_restaurant_id', COALESCE(v_restaurant_id::text, ''), true);
    END $$;
  `);

  // 5. Add nullable restaurant_id to every tenant table, then backfill, then enforce NOT NULL.
  for (const table of TENANT_TABLES) {
    pgm.addColumns(table, {
      restaurant_id: { type: "uuid" },
    });
    pgm.sql(`
      UPDATE ${table}
      SET restaurant_id = NULLIF(current_setting('app.bootstrap_restaurant_id', true), '')::uuid
      WHERE restaurant_id IS NULL
        AND NULLIF(current_setting('app.bootstrap_restaurant_id', true), '') IS NOT NULL;
    `);
  }

  // Drop pre-existing indexes/constraints that need to incorporate restaurant_id.
  pgm.sql(`DROP INDEX IF EXISTS "dishes_category_available_idx";`);

  // Enforce NOT NULL + add FKs + tenant-aware indexes.
  for (const table of TENANT_TABLES) {
    pgm.alterColumn(table, "restaurant_id", { notNull: true });
    pgm.addConstraint(table, `${table}_restaurant_id_fk`, {
      foreignKeys: { columns: "restaurant_id", references: '"restaurants"', onDelete: "CASCADE" },
    });
    pgm.createIndex(table, "restaurant_id", { name: `${table}_restaurant_id_idx` });
  }

  // Replace old indexes with restaurant-scoped composites for the hot paths.
  pgm.sql(`DROP INDEX IF EXISTS "customers_email_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "customers_name_idx";`);
  pgm.createIndex("customers", ["restaurant_id", "email"], { name: "customers_restaurant_email_idx" });
  pgm.createIndex("customers", ["restaurant_id", "last_name", "first_name"], { name: "customers_restaurant_name_idx" });

  pgm.sql(`DROP INDEX IF EXISTS "orders_status_created_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "orders_customer_idx";`);
  pgm.createIndex("orders", ["restaurant_id", "status", "created_at"], {
    name: "orders_restaurant_status_created_idx",
  });
  pgm.createIndex("orders", "customer_id", { name: "orders_customer_idx" });

  pgm.createIndex("dishes", ["restaurant_id", "category_id", "available"], {
    name: "dishes_restaurant_category_available_idx",
  });

  pgm.sql(`DROP INDEX IF EXISTS "categories_position_idx";`);
  pgm.createIndex("categories", ["restaurant_id", "position"], { name: "categories_restaurant_position_idx" });

  pgm.sql(`DROP INDEX IF EXISTS "notifications_read_created_idx";`);
  pgm.createIndex("notifications", ["restaurant_id", "read_at", "created_at"], {
    name: "notifications_restaurant_read_created_idx",
  });

  // 6. Drop the legacy single-row settings table — its content lives in `restaurants` now.
  pgm.dropTable("restaurant_settings");

  // 7. Helpful index on accounts(user_id) for the auth hook lookups.
  pgm.createIndex("accounts", "user_id", { name: "accounts_user_idx", ifNotExists: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Recreate the legacy settings table (data lost beyond the first restaurant).
  pgm.createTable("restaurant_settings", {
    id: { type: "text", primaryKey: true, notNull: true, default: "default" },
    name: { type: "text", notNull: true },
    address: { type: "text" },
    phone: { type: "text" },
    opening_hours_json: { type: "jsonb", notNull: true },
    notifications_json: { type: "jsonb", notNull: true },
    currency: { type: "text", notNull: true, default: "EUR" },
    updated_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });

  pgm.sql(`
    INSERT INTO restaurant_settings (id, name, address, phone, currency, opening_hours_json, notifications_json)
    SELECT 'default', name, address, phone, currency, opening_hours_json, notifications_json
    FROM restaurants
    ORDER BY created_at
    LIMIT 1
    ON CONFLICT (id) DO NOTHING;
  `);

  for (const table of TENANT_TABLES) {
    pgm.dropConstraint(table, `${table}_restaurant_id_fk`, { ifExists: true });
    pgm.sql(`DROP INDEX IF EXISTS "${table}_restaurant_id_idx";`);
    pgm.dropColumn(table, "restaurant_id");
  }

  pgm.sql(`DROP INDEX IF EXISTS "customers_restaurant_email_idx";`);
  pgm.sql(`DROP INDEX IF EXISTS "customers_restaurant_name_idx";`);
  pgm.createIndex("customers", "email", { name: "customers_email_idx" });
  pgm.createIndex("customers", ["last_name", "first_name"], { name: "customers_name_idx" });

  pgm.sql(`DROP INDEX IF EXISTS "orders_restaurant_status_created_idx";`);
  pgm.createIndex("orders", ["status", "created_at"], { name: "orders_status_created_idx" });

  pgm.sql(`DROP INDEX IF EXISTS "dishes_restaurant_category_available_idx";`);
  pgm.createIndex("dishes", ["category_id", "available"], { name: "dishes_category_available_idx" });

  pgm.sql(`DROP INDEX IF EXISTS "categories_restaurant_position_idx";`);
  pgm.createIndex("categories", "position", { name: "categories_position_idx" });

  pgm.sql(`DROP INDEX IF EXISTS "notifications_restaurant_read_created_idx";`);
  pgm.createIndex("notifications", ["read_at", "created_at"], { name: "notifications_read_created_idx" });

  pgm.dropTable("invitations");
  pgm.dropTable("restaurant_members");
  pgm.dropTable("restaurants");
}
