import { db } from "@ody/db/client";
import { categories, dishes } from "@ody/db/schema";
import {
  Category,
  type CategoryId,
  type CategoryRepository,
  Dish,
  type DishId,
  type DishRepository,
  type ListDishesOptions,
  toCategoryId,
  toDishId,
} from "@ody/domain/catalog";
import type { PagedResult } from "@ody/domain/customer";
import { type DomainError, Money, type Result } from "@ody/domain/shared-kernel";
import { and, asc, eq, ilike, inArray, type SQL, sql } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

interface CategoryRow {
  id: string;
  name: string;
  position: number;
}

interface DishRow {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  available: boolean;
  imageUrl: string | null;
  createdAt: Date;
}

const rowToCategory = (row: CategoryRow): Category =>
  Category.restore({
    id: toCategoryId(row.id),
    name: row.name,
    position: row.position,
  });

const rowToDish = (row: DishRow): Dish =>
  Dish.restore({
    id: toDishId(row.id),
    categoryId: toCategoryId(row.categoryId),
    name: row.name,
    description: row.description,
    price: Money.fromCents(row.priceCents),
    available: row.available,
    imageUrl: row.imageUrl,
    createdAt: row.createdAt,
  });

export class DrizzleCategoryRepository implements CategoryRepository {
  list(restaurantId: string): Promise<Result<Category[], DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select()
        .from(categories)
        .where(eq(categories.restaurantId, restaurantId))
        .orderBy(asc(categories.position));

      return rows.map((r) => rowToCategory(r as CategoryRow));
    });
  }

  findById(restaurantId: string, id: CategoryId): Promise<Result<Category | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select()
        .from(categories)
        .where(and(eq(categories.restaurantId, restaurantId), eq(categories.id, id)))
        .limit(1);
      const r = rows[0];

      return r ? rowToCategory(r as CategoryRow) : null;
    });
  }

  save(restaurantId: string, category: Category): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db
        .insert(categories)
        .values({
          id: category.id,
          restaurantId,
          name: category.name,
          position: category.position,
        })
        .onConflictDoUpdate({
          target: categories.id,
          setWhere: eq(categories.restaurantId, restaurantId),
          set: { name: category.name, position: category.position },
        });
    });
  }

  delete(restaurantId: string, id: CategoryId): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db.delete(categories).where(and(eq(categories.restaurantId, restaurantId), eq(categories.id, id)));
    });
  }
}

export class DrizzleDishRepository implements DishRepository {
  list(opts: ListDishesOptions): Promise<Result<PagedResult<Dish>, DomainError>> {
    return runQuery(async () => {
      const offset = (opts.page - 1) * opts.pageSize;
      const filters: SQL[] = [eq(dishes.restaurantId, opts.restaurantId)];

      if (opts.categoryId) filters.push(eq(dishes.categoryId, opts.categoryId));

      if (opts.available !== undefined) filters.push(eq(dishes.available, opts.available));

      if (opts.search) filters.push(ilike(dishes.name, `%${opts.search}%`));

      const where = and(...filters);

      const itemsQuery = db
        .select()
        .from(dishes)
        .where(where)
        .orderBy(asc(dishes.name))
        .limit(opts.pageSize)
        .offset(offset);

      const totalQuery = db.select({ count: sql<number>`count(*)::int` }).from(dishes).where(where);

      const [rows, totalRows] = await Promise.all([itemsQuery, totalQuery]);

      return {
        items: rows.map((r) => rowToDish(r as DishRow)),
        total: totalRows[0]?.count ?? 0,
        page: opts.page,
        pageSize: opts.pageSize,
      };
    });
  }

  findById(restaurantId: string, id: DishId): Promise<Result<Dish | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select()
        .from(dishes)
        .where(and(eq(dishes.restaurantId, restaurantId), eq(dishes.id, id)))
        .limit(1);
      const r = rows[0];

      return r ? rowToDish(r as DishRow) : null;
    });
  }

  findByIds(restaurantId: string, ids: DishId[]): Promise<Result<Dish[], DomainError>> {
    return runQuery(async () => {
      if (ids.length === 0) return [];

      const rows = await db
        .select()
        .from(dishes)
        .where(and(eq(dishes.restaurantId, restaurantId), inArray(dishes.id, ids as unknown as string[])));

      return rows.map((r) => rowToDish(r as DishRow));
    });
  }

  save(restaurantId: string, dish: Dish): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db
        .insert(dishes)
        .values({
          id: dish.id,
          restaurantId,
          categoryId: dish.categoryId,
          name: dish.name,
          description: dish.description,
          priceCents: dish.price.cents,
          available: dish.available,
          imageUrl: dish.imageUrl,
          createdAt: dish.createdAt,
        })
        .onConflictDoUpdate({
          target: dishes.id,
          setWhere: eq(dishes.restaurantId, restaurantId),
          set: {
            categoryId: dish.categoryId,
            name: dish.name,
            description: dish.description,
            priceCents: dish.price.cents,
            available: dish.available,
            imageUrl: dish.imageUrl,
          },
        });
    });
  }

  delete(restaurantId: string, id: DishId): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db.delete(dishes).where(and(eq(dishes.restaurantId, restaurantId), eq(dishes.id, id)));
    });
  }
}

export const categoryRepository = new DrizzleCategoryRepository();
export const dishRepository = new DrizzleDishRepository();
