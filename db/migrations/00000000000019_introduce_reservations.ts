import type { MigrationBuilder } from "node-pg-migrate";

/**
 * Reservation system.
 *  - restaurant_tables: physical tables with capacity, scoped per restaurant
 *  - reservations: time-slot bookings on a specific table, optionally linked to a customer
 *  - orders gets nullable links to reservation + table (legacy table_number kept for now)
 *
 * Conflict detection: PostgreSQL EXCLUDE constraint via btree_gist + gist on tstzrange,
 * filtered by active statuses so cancelled/no_show don't block.
 */
export const up = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

  pgm.createTable("restaurant_tables", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    restaurant_id: {
      type: "uuid",
      notNull: true,
      references: '"restaurants"',
      onDelete: "CASCADE",
    },
    label: { type: "text", notNull: true },
    capacity: { type: "integer", notNull: true },
    position: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("restaurant_tables", "restaurant_tables_capacity_positive", {
    check: "capacity > 0",
  });
  pgm.sql(`CREATE UNIQUE INDEX restaurant_tables_restaurant_label_unique
           ON restaurant_tables (restaurant_id, lower(label));`);
  pgm.createIndex("restaurant_tables", ["restaurant_id", "position"], {
    name: "restaurant_tables_restaurant_position_idx",
  });

  pgm.createTable("reservations", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    restaurant_id: {
      type: "uuid",
      notNull: true,
      references: '"restaurants"',
      onDelete: "CASCADE",
    },
    table_id: {
      type: "uuid",
      notNull: true,
      references: '"restaurant_tables"',
      onDelete: "RESTRICT",
    },
    customer_id: {
      type: "uuid",
      references: '"customers"',
      onDelete: "SET NULL",
    },
    guest_name: { type: "text" },
    guest_phone: { type: "text" },
    party_size: { type: "integer", notNull: true },
    starts_at: { type: "timestamptz", notNull: true },
    ends_at: { type: "timestamptz", notNull: true },
    status: { type: "text", notNull: true, default: "pending" },
    notes: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.addConstraint("reservations", "reservations_party_size_positive", { check: "party_size > 0" });
  pgm.addConstraint("reservations", "reservations_ends_after_starts", { check: "ends_at > starts_at" });
  pgm.addConstraint("reservations", "reservations_status_valid", {
    check: "status IN ('pending','confirmed','seated','completed','cancelled','no_show')",
  });

  pgm.createIndex("reservations", ["restaurant_id", "starts_at"], {
    name: "reservations_restaurant_starts_idx",
  });
  pgm.createIndex("reservations", ["table_id", "starts_at"], {
    name: "reservations_table_starts_idx",
  });
  pgm.createIndex("reservations", "customer_id", {
    name: "reservations_customer_idx",
    where: "customer_id IS NOT NULL",
  });

  // Prevent double-booking on the same table when status is active.
  pgm.sql(`
    ALTER TABLE reservations
    ADD CONSTRAINT reservations_no_overlap
    EXCLUDE USING gist (
      table_id WITH =,
      tstzrange(starts_at, ends_at, '[)') WITH &&
    ) WHERE (status IN ('pending','confirmed','seated'));
  `);

  // Orders links.
  pgm.addColumns("orders", {
    reservation_id: {
      type: "uuid",
      references: '"reservations"',
      onDelete: "SET NULL",
    },
    table_id: {
      type: "uuid",
      references: '"restaurant_tables"',
      onDelete: "SET NULL",
    },
  });
  pgm.createIndex("orders", "reservation_id", {
    name: "orders_reservation_idx",
    where: "reservation_id IS NOT NULL",
  });
  pgm.createIndex("orders", "table_id", {
    name: "orders_table_idx",
    where: "table_id IS NOT NULL",
  });
};

export const down = async (): Promise<void> => {
  throw new Error("Migration 00000000000019_introduce_reservations is non-reversible (data shape).");
};
