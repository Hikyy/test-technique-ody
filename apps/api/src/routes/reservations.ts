import { db } from "@ody/db/client";
import { customers, reservations, restaurantTables } from "@ody/db/schema";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import type { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";

function pgError(err: unknown): { code?: string; constraint?: string } {
  let cur: unknown = err;

  for (let i = 0; i < 5 && cur && typeof cur === "object"; i++) {
    const e = cur as { code?: string; constraint?: string; cause?: unknown };

    if (typeof e.code === "string") return { code: e.code, constraint: e.constraint };

    cur = e.cause;
  }

  return {};
}

const RESERVATION_STATUS = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"] as const;

type ReservationStatus = (typeof RESERVATION_STATUS)[number];

const ReservationSchema = z.object({
  type: z.literal("reservations"),
  id: z.string().uuid(),
  attributes: z.object({
    table_id: z.string().uuid(),
    table_label: z.string(),
    customer_id: z.string().uuid().nullable(),
    guest_name: z.string().nullable(),
    guest_phone: z.string().nullable(),
    party_size: z.number().int().positive(),
    starts_at: z.string(),
    ends_at: z.string(),
    status: z.enum(RESERVATION_STATUS),
    notes: z.string().nullable(),
  }),
});

interface ReservationRow {
  id: string;
  tableId: string;
  tableLabel: string;
  customerId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  partySize: number;
  startsAt: Date;
  endsAt: Date;
  status: ReservationStatus;
  notes: string | null;
}

const toResource = (r: ReservationRow) => ({
  type: "reservations" as const,
  id: r.id,
  attributes: {
    table_id: r.tableId,
    table_label: r.tableLabel,
    customer_id: r.customerId,
    guest_name: r.guestName,
    guest_phone: r.guestPhone,
    party_size: r.partySize,
    starts_at: r.startsAt.toISOString(),
    ends_at: r.endsAt.toISOString(),
    status: r.status,
    notes: r.notes,
  },
});

export function buildReservationRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth, requireOrganization, requireRestaurant);

  sub.get("/", async (c) => {
    const from = c.req.query("from");
    const to = c.req.query("to");
    const statusParam = c.req.query("status");

    const filters = [eq(reservations.restaurantId, c.var.restaurant.restaurantId)];

    if (from) filters.push(gte(reservations.startsAt, new Date(from)));

    if (to) filters.push(lt(reservations.startsAt, new Date(to)));

    if (statusParam) {
      const list = statusParam.split(",").map((s) => s.trim()) as ReservationStatus[];

      filters.push(inArray(reservations.status, list));
    }

    const rows = await db
      .select({
        id: reservations.id,
        tableId: reservations.tableId,
        tableLabel: restaurantTables.label,
        customerId: reservations.customerId,
        guestName: reservations.guestName,
        guestPhone: reservations.guestPhone,
        partySize: reservations.partySize,
        startsAt: reservations.startsAt,
        endsAt: reservations.endsAt,
        status: reservations.status,
        notes: reservations.notes,
      })
      .from(reservations)
      .innerJoin(restaurantTables, eq(restaurantTables.id, reservations.tableId))
      .where(and(...filters))
      .orderBy(asc(reservations.startsAt));

    const customerIds = Array.from(new Set(rows.map((r) => r.customerId).filter((id): id is string => Boolean(id))));
    const includedCustomers =
      customerIds.length > 0
        ? await db
            .select({
              id: customers.id,
              firstName: customers.firstName,
              lastName: customers.lastName,
              email: customers.email,
              phone: customers.phone,
            })
            .from(customers)
            .where(inArray(customers.id, customerIds))
        : [];

    return c.json({
      data: rows.map((r) => toResource({ ...r, status: r.status as ReservationStatus })),
      included: includedCustomers.map((c) => ({
        type: "customers" as const,
        id: c.id,
        attributes: {
          first_name: c.firstName,
          last_name: c.lastName,
          email: c.email,
          phone: c.phone,
        },
      })),
      meta: { total: rows.length },
    });
  });

  const CreateBody = z
    .object({
      table_id: z.string().uuid(),
      customer_id: z.string().uuid().nullable().optional(),
      guest_name: z.string().min(1).max(120).nullable().optional(),
      guest_phone: z.string().max(40).nullable().optional(),
      party_size: z.number().int().min(1).max(50),
      starts_at: z.string().datetime(),
      ends_at: z.string().datetime(),
      status: z.enum(RESERVATION_STATUS).optional(),
      notes: z.string().max(2000).nullable().optional(),
    })
    .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
      message: "ends_at must be after starts_at",
      path: ["ends_at"],
    })
    .refine((d) => Boolean(d.customer_id) || Boolean(d.guest_name), {
      message: "customer_id or guest_name is required",
      path: ["customer_id"],
    });

  sub.post("/", async (c) => {
    const parsed = CreateBody.safeParse(await c.req.json());

    if (!parsed.success) {
      return c.json(
        { errors: [{ status: "422", code: "VALIDATION", title: "Invalid", detail: parsed.error.message }] },
        422,
      );
    }

    const d = parsed.data;

    const [tbl] = await db
      .select({ id: restaurantTables.id, capacity: restaurantTables.capacity, label: restaurantTables.label })
      .from(restaurantTables)
      .where(and(eq(restaurantTables.id, d.table_id), eq(restaurantTables.restaurantId, c.var.restaurant.restaurantId)))
      .limit(1);

    if (!tbl) {
      return c.json(
        { errors: [{ status: "404", code: "NOT_FOUND", title: "Not Found", detail: "Table not found" }] },
        404,
      );
    }

    if (d.party_size > tbl.capacity) {
      return c.json(
        {
          errors: [
            {
              status: "422",
              code: "OVER_CAPACITY",
              title: "Over capacity",
              detail: `Table ${tbl.label} seats ${tbl.capacity}, requested ${d.party_size}`,
            },
          ],
        },
        422,
      );
    }

    try {
      const [row] = await db
        .insert(reservations)
        .values({
          restaurantId: c.var.restaurant.restaurantId,
          tableId: d.table_id,
          customerId: d.customer_id ?? null,
          guestName: d.guest_name ?? null,
          guestPhone: d.guest_phone ?? null,
          partySize: d.party_size,
          startsAt: new Date(d.starts_at),
          endsAt: new Date(d.ends_at),
          status: d.status ?? "pending",
          notes: d.notes ?? null,
        })
        .returning({
          id: reservations.id,
          tableId: reservations.tableId,
          customerId: reservations.customerId,
          guestName: reservations.guestName,
          guestPhone: reservations.guestPhone,
          partySize: reservations.partySize,
          startsAt: reservations.startsAt,
          endsAt: reservations.endsAt,
          status: reservations.status,
          notes: reservations.notes,
        });

      if (!row) throw new Error("insert");

      return c.json(
        { data: toResource({ ...row, tableLabel: tbl.label, status: row.status as ReservationStatus }) },
        201,
      );
    } catch (err) {
      const e = pgError(err);

      if (e.code === "23P01" && e.constraint === "reservations_no_overlap") {
        return c.json(
          { errors: [{ status: "409", code: "TABLE_BUSY", title: "Table busy", detail: "Time slot already booked" }] },
          409,
        );
      }

      throw err;
    }
  });

  const UpdateBody = z.object({
    status: z.enum(RESERVATION_STATUS).optional(),
    party_size: z.number().int().min(1).max(50).optional(),
    starts_at: z.string().datetime().optional(),
    ends_at: z.string().datetime().optional(),
    table_id: z.string().uuid().optional(),
    notes: z.string().max(2000).nullable().optional(),
    customer_id: z.string().uuid().nullable().optional(),
    guest_name: z.string().min(1).max(120).nullable().optional(),
    guest_phone: z.string().max(40).nullable().optional(),
  });

  sub.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const parsed = UpdateBody.safeParse(await c.req.json());

    if (!parsed.success) {
      return c.json(
        { errors: [{ status: "422", code: "VALIDATION", title: "Invalid", detail: parsed.error.message }] },
        422,
      );
    }

    const d = parsed.data;

    const updateSet: Record<string, unknown> = { updatedAt: new Date() };

    if (d.status) updateSet.status = d.status;

    if (d.party_size != null) updateSet.partySize = d.party_size;

    if (d.starts_at) updateSet.startsAt = new Date(d.starts_at);

    if (d.ends_at) updateSet.endsAt = new Date(d.ends_at);

    if (d.table_id) {
      const [tbl] = await db
        .select({ id: restaurantTables.id })
        .from(restaurantTables)
        .where(
          and(eq(restaurantTables.id, d.table_id), eq(restaurantTables.restaurantId, c.var.restaurant.restaurantId)),
        )
        .limit(1);

      if (!tbl) {
        return c.json(
          { errors: [{ status: "404", code: "NOT_FOUND", title: "Not Found", detail: "Table not found" }] },
          404,
        );
      }

      updateSet.tableId = d.table_id;
    }

    if (d.notes !== undefined) updateSet.notes = d.notes;

    if (d.customer_id !== undefined) updateSet.customerId = d.customer_id;

    if (d.guest_name !== undefined) updateSet.guestName = d.guest_name;

    if (d.guest_phone !== undefined) updateSet.guestPhone = d.guest_phone;

    try {
      const [row] = await db
        .update(reservations)
        .set(updateSet)
        .where(and(eq(reservations.id, id), eq(reservations.restaurantId, c.var.restaurant.restaurantId)))
        .returning({
          id: reservations.id,
          tableId: reservations.tableId,
          customerId: reservations.customerId,
          guestName: reservations.guestName,
          guestPhone: reservations.guestPhone,
          partySize: reservations.partySize,
          startsAt: reservations.startsAt,
          endsAt: reservations.endsAt,
          status: reservations.status,
          notes: reservations.notes,
        });

      if (!row) {
        return c.json(
          { errors: [{ status: "404", code: "NOT_FOUND", title: "Not Found", detail: "Reservation not found" }] },
          404,
        );
      }

      const [tbl] = await db
        .select({ label: restaurantTables.label })
        .from(restaurantTables)
        .where(eq(restaurantTables.id, row.tableId))
        .limit(1);

      return c.json({
        data: toResource({ ...row, tableLabel: tbl?.label ?? "—", status: row.status as ReservationStatus }),
      });
    } catch (err) {
      const e = pgError(err);

      if (e.code === "23P01" && e.constraint === "reservations_no_overlap") {
        return c.json(
          { errors: [{ status: "409", code: "TABLE_BUSY", title: "Table busy", detail: "Time slot already booked" }] },
          409,
        );
      }

      throw err;
    }
  });

  sub.delete("/:id", async (c) => {
    const id = c.req.param("id");
    const result = await db
      .delete(reservations)
      .where(and(eq(reservations.id, id), eq(reservations.restaurantId, c.var.restaurant.restaurantId)))
      .returning({ id: reservations.id });

    if (result.length === 0) {
      return c.json(
        { errors: [{ status: "404", code: "NOT_FOUND", title: "Not Found", detail: "Reservation not found" }] },
        404,
      );
    }

    return c.body(null, 204);
  });

  return sub;
}

export function registerReservationRoutes(app: Hono<AppEnv>): void {
  app.route("/api/reservations", buildReservationRoutes());
}

export { ReservationSchema };
