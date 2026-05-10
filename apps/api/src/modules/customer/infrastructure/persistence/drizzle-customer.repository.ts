import { db } from "@ody/db/client";
import { customers } from "@ody/db/schema";
import {
  Customer,
  type CustomerId,
  type CustomerRepository,
  type ListCustomersOptions,
  type PagedResult,
  toCustomerId,
} from "@ody/domain/customer";
import { type DomainError, Email, Money, PhoneNumber, type Result } from "@ody/domain/shared-kernel";
import { and, asc, desc, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";
import { runQuery } from "../../../shared/run-query.js";

interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  visitsCount: number;
  spentCents: number;
  createdAt: Date;
  updatedAt: Date;
}

const rowToCustomer = (row: CustomerRow): Customer => {
  let emailVo: Email | null = null;

  if (row.email) {
    const r = Email.create(row.email);

    if (r.ok) emailVo = r.value;
  }

  let phoneVo: PhoneNumber | null = null;

  if (row.phone) {
    const r = PhoneNumber.create(row.phone);

    if (r.ok) phoneVo = r.value;
  }

  return Customer.restore({
    id: toCustomerId(row.id),
    firstName: row.firstName,
    lastName: row.lastName,
    email: emailVo,
    phone: phoneVo,
    notes: row.notes,
    visitsCount: row.visitsCount,
    spent: Money.fromCents(row.spentCents),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
};

export class DrizzleCustomerRepository implements CustomerRepository {
  findById(organizationId: string, id: CustomerId): Promise<Result<Customer | null, DomainError>> {
    return runQuery(async () => {
      const rows = await db
        .select()
        .from(customers)
        .where(and(eq(customers.organizationId, organizationId), eq(customers.id, id)))
        .limit(1);
      const r = rows[0];

      return r ? rowToCustomer(r as CustomerRow) : null;
    });
  }

  findByIds(organizationId: string, ids: CustomerId[]): Promise<Result<Customer[], DomainError>> {
    return runQuery(async () => {
      if (ids.length === 0) return [];

      const rows = await db
        .select()
        .from(customers)
        .where(and(eq(customers.organizationId, organizationId), inArray(customers.id, ids as unknown as string[])));

      return rows.map((r) => rowToCustomer(r as CustomerRow));
    });
  }

  list(opts: ListCustomersOptions): Promise<Result<PagedResult<Customer>, DomainError>> {
    return runQuery(async () => {
      const offset = (opts.page - 1) * opts.pageSize;
      const needle = opts.search?.trim();
      const scope = opts.search_scope ?? "name";

      const filters: SQL[] = [eq(customers.organizationId, opts.organizationId)];

      if (needle) {
        if (scope === "name") {
          const named = or(ilike(customers.firstName, `%${needle}%`), ilike(customers.lastName, `%${needle}%`));

          if (named) filters.push(named);
        } else if (scope === "email") {
          filters.push(ilike(customers.email, `%${needle}%`));
        } else {
          // phone: normalize both sides to digits only so "06 12" matches "+33 6 12…"
          const digits = needle.replace(/\D/g, "");

          filters.push(
            digits ? sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g') ILIKE ${`%${digits}%`}` : sql`false`,
          );
        }
      }

      const where = and(...filters);

      const itemsQuery = db
        .select()
        .from(customers)
        .where(where)
        .orderBy(desc(customers.createdAt), asc(customers.lastName))
        .limit(opts.pageSize)
        .offset(offset);

      const totalQuery = db.select({ count: sql<number>`count(*)::int` }).from(customers).where(where);

      const [rows, totalRows] = await Promise.all([itemsQuery, totalQuery]);

      return {
        items: rows.map((r) => rowToCustomer(r as CustomerRow)),
        total: totalRows[0]?.count ?? 0,
        page: opts.page,
        pageSize: opts.pageSize,
      };
    });
  }

  save(organizationId: string, customer: Customer): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      const row = {
        id: customer.id,
        organizationId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email?.value ?? null,
        phone: customer.phone?.value ?? null,
        notes: customer.notes,
        visitsCount: customer.visitsCount,
        spentCents: customer.spent.cents,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };

      await db
        .insert(customers)
        .values(row)
        .onConflictDoUpdate({
          target: customers.id,
          // Defense in depth: only update rows that belong to this tenant.
          setWhere: eq(customers.organizationId, organizationId),
          set: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            notes: row.notes,
            visitsCount: row.visitsCount,
            spentCents: row.spentCents,
            updatedAt: row.updatedAt,
          },
        });
    });
  }

  delete(organizationId: string, id: CustomerId): Promise<Result<void, DomainError>> {
    return runQuery(async () => {
      await db.delete(customers).where(and(eq(customers.organizationId, organizationId), eq(customers.id, id)));
    });
  }
}

export const customerRepository = new DrizzleCustomerRepository();
