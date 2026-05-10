import { db } from "@ody/db/client";
import { restaurantTables } from "@ody/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../app.js";
import { requireAuth, requireOrganization, requireRestaurant } from "../auth/middleware.js";
import { factory } from "../factory.js";

const TableSchema = z.object({
  type: z.literal("restaurant-tables"),
  id: z.string().uuid(),
  attributes: z.object({
    label: z.string(),
    capacity: z.number().int().positive(),
    position: z.number().int().nonnegative(),
    created_at: z.string(),
  }),
});

function pgError(err: unknown): { code?: string; constraint?: string } {
  let cur: unknown = err;

  for (let i = 0; i < 5 && cur && typeof cur === "object"; i++) {
    const e = cur as { code?: string; constraint?: string; cause?: unknown };

    if (typeof e.code === "string") return { code: e.code, constraint: e.constraint };

    cur = e.cause;
  }

  return {};
}

interface TableRow {
  id: string;
  label: string;
  capacity: number;
  position: number;
  createdAt: Date;
}

const toResource = (r: TableRow) => ({
  type: "restaurant-tables" as const,
  id: r.id,
  attributes: {
    label: r.label,
    capacity: r.capacity,
    position: r.position,
    created_at: r.createdAt.toISOString(),
  },
});

export function buildTableRoutes(): Hono<AppEnv> {
  const sub = factory.createApp();

  sub.use("*", requireAuth, requireOrganization, requireRestaurant);

  sub.get("/", async (c) => {
    const rows = await db
      .select({
        id: restaurantTables.id,
        label: restaurantTables.label,
        capacity: restaurantTables.capacity,
        position: restaurantTables.position,
        createdAt: restaurantTables.createdAt,
      })
      .from(restaurantTables)
      .where(eq(restaurantTables.restaurantId, c.var.restaurant.restaurantId))
      .orderBy(asc(restaurantTables.position), asc(restaurantTables.label));

    return c.json({ data: rows.map(toResource), meta: { total: rows.length } });
  });

  const CreateBody = z.object({
    label: z.string().min(1).max(40),
    capacity: z.number().int().min(1).max(50),
    position: z.number().int().min(0).max(999).optional(),
  });

  sub.post("/", async (c) => {
    const body = CreateBody.safeParse(await c.req.json());

    if (!body.success) {
      return c.json(
        { errors: [{ status: "422", code: "VALIDATION", title: "Invalid", detail: body.error.message }] },
        422,
      );
    }

    try {
      const [row] = await db
        .insert(restaurantTables)
        .values({
          restaurantId: c.var.restaurant.restaurantId,
          label: body.data.label.trim(),
          capacity: body.data.capacity,
          position: body.data.position ?? 0,
        })
        .returning({
          id: restaurantTables.id,
          label: restaurantTables.label,
          capacity: restaurantTables.capacity,
          position: restaurantTables.position,
          createdAt: restaurantTables.createdAt,
        });

      if (!row) throw new Error("insert");

      return c.json({ data: toResource(row) }, 201);
    } catch (err) {
      const e = pgError(err);

      if (e.code === "23505" && e.constraint === "restaurant_tables_restaurant_label_unique") {
        return c.json(
          { errors: [{ status: "409", code: "CONFLICT", title: "Conflict", detail: "Label already used" }] },
          409,
        );
      }

      throw err;
    }
  });

  const UpdateBody = z.object({
    label: z.string().min(1).max(40).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    position: z.number().int().min(0).max(999).optional(),
  });

  sub.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = UpdateBody.safeParse(await c.req.json());

    if (!body.success) {
      return c.json(
        { errors: [{ status: "422", code: "VALIDATION", title: "Invalid", detail: body.error.message }] },
        422,
      );
    }

    const [row] = await db
      .update(restaurantTables)
      .set({ ...body.data, updatedAt: new Date() })
      .where(and(eq(restaurantTables.id, id), eq(restaurantTables.restaurantId, c.var.restaurant.restaurantId)))
      .returning({
        id: restaurantTables.id,
        label: restaurantTables.label,
        capacity: restaurantTables.capacity,
        position: restaurantTables.position,
        createdAt: restaurantTables.createdAt,
      });

    if (!row) {
      return c.json(
        { errors: [{ status: "404", code: "NOT_FOUND", title: "Not Found", detail: "Table not found" }] },
        404,
      );
    }

    return c.json({ data: toResource(row) });
  });

  sub.delete("/:id", async (c) => {
    const id = c.req.param("id");

    try {
      const result = await db
        .delete(restaurantTables)
        .where(and(eq(restaurantTables.id, id), eq(restaurantTables.restaurantId, c.var.restaurant.restaurantId)))
        .returning({ id: restaurantTables.id });

      if (result.length === 0) {
        return c.json(
          { errors: [{ status: "404", code: "NOT_FOUND", title: "Not Found", detail: "Table not found" }] },
          404,
        );
      }

      return c.body(null, 204);
    } catch (err) {
      const e = pgError(err);

      if (e.code === "23503") {
        return c.json(
          {
            errors: [
              {
                status: "409",
                code: "CONFLICT",
                title: "In use",
                detail: "Table referenced by reservations or orders",
              },
            ],
          },
          409,
        );
      }

      throw err;
    }
  });

  return sub;
}

export function registerTableRoutes(app: Hono<AppEnv>): void {
  app.route("/api/tables", buildTableRoutes());
}

export { TableSchema };
