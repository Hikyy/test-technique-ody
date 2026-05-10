# PostgreSQL Database Audit — Sève

Audit applied across three lenses: **table design**, **code review** (queries, transactions, application↔DB seams) and **optimization** (indexes, query plans, hot paths). Status reflects post-multi-tenancy migration (`00000000000012_introduce_multi_tenancy`).

---

## A. Table design

### A.1 Multi-tenancy — RESOLVED in 0012

Before: every tenant table (customers, categories, dishes, orders, notifications) had no owner. `restaurant_settings` was a single-row table (`id text default 'default'`). **Cross-tenant data leak**: any authenticated user saw every restaurant's data.

After: `restaurants` (proper entity, replaces `restaurant_settings`), `restaurant_members` (user↔restaurant pivot with role), `invitations` (token-based onboarding). Every tenant table carries a NOT NULL `restaurant_id` FK with `ON DELETE CASCADE`. Existing data backfilled to a default restaurant; existing users auto-promoted to members (first one as owner).

### A.2 Defense-in-depth on `order_lines`

`order_lines` does NOT carry `restaurant_id` directly — it's reachable via `orders.restaurant_id` and `dishes.restaurant_id`. **Risk**: an application bug could insert an `order_line` whose `dish_id` belongs to a different restaurant than its parent `order`. SQL alone cannot prevent this without either:
- adding `restaurant_id` to `order_lines` + a check constraint (`restaurant_id = (SELECT restaurant_id FROM orders WHERE id = order_id)`) — Postgres doesn't allow subqueries in CHECK; would need a trigger.
- or enforcing tenant consistency at the application layer (Action ensures `dish.restaurantId === order.restaurantId` before insert).

**Decision**: the application layer is the correct place — domain Actions already validate this implicitly because they fetch dishes through repositories already scoped by `restaurantId`. Adding a trigger would couple the schema to the multi-tenant model and slow inserts. Documented as a defensive responsibility of the Ordering aggregate.

### A.3 Type choices

- All primary keys: `uuid` with `gen_random_uuid()` (v4). **Recommendation (P3)**: switch to UUIDv7 once `pg_uuidv7` extension is acceptable — improves B-tree locality and INSERT throughput on hot tables. Not blocking.
- Money: `integer` cents — correct (avoids floating-point). Consider `bigint` only if a single `total_cents` could exceed 2.1 B (≈ 21M €) — not realistic for restaurant orders.
- Timestamps: `timestamp with time zone` everywhere — correct.
- Text: unbounded `text` — fine for Postgres (no perf cost vs `varchar(n)`). App-layer Zod schemas cap lengths (e.g. `name.max(120)`).
- JSONB: used for `opening_hours_json`, `notifications_json`, `notifications.data`. Strongly typed at the app layer via Drizzle `$type<…>`. **Recommendation (P3)**: add a CHECK on `notifications.data` requiring `jsonb_typeof(data) = 'object'` — defends against `null`/array misuse.

### A.4 Constraints — gaps

| Where | Missing | Severity | Action |
|---|---|---|---|
| `customers.email` | unique per restaurant | P2 | partial unique index `WHERE email IS NOT NULL` |
| `customers.phone` | unique per restaurant | P3 | partial unique index — but customers can share numbers (hotel desk, family). **Skip**. |
| `users.email` | already unique globally ✓ | — | — |
| `restaurants.currency` | ISO 4217 (3 chars) | P3 | check `char_length(currency) = 3` |
| `orders.total_cents` | non-negative | P2 | `CHECK (total_cents >= 0)` |
| `invitations` (active) | unique pending invite per (restaurant, email) | P2 | partial unique on `(restaurant_id, lower(email)) WHERE accepted_at IS NULL` |
| `users.email` | case-insensitive | P3 | citext extension OR lowercase at write time (Better Auth already lowercases) |

### A.5 Cascade strategy

| Parent → child | Rule | Status |
|---|---|---|
| `restaurants` → `customers/categories/dishes/orders/notifications` | `CASCADE` | ✓ data follows tenant lifecycle |
| `restaurants` → `restaurant_members` | `CASCADE` | ✓ |
| `restaurants` → `invitations` | `CASCADE` | ✓ |
| `users` → `accounts/sessions/restaurant_members` | `CASCADE` | ✓ |
| `categories` → `dishes` | `CASCADE` | ⚠ aggressive — deleting a category deletes all dishes in it. Could prefer `RESTRICT` if business cares (ask UX). For now, keep CASCADE since the UI offers explicit "delete dish" first. |
| `dishes` ← `order_lines` | `RESTRICT` | ✓ historical orders preserved |
| `customers` ← `orders.customer_id` | `SET NULL` | ✓ customer deletion preserves order history |
| `orders` → `order_lines` | `CASCADE` | ✓ |

### A.6 Soft delete — not implemented

Currently every `DELETE` is hard. For an MVP this is fine; for compliance/audit-readiness, plan a `deleted_at` column on `customers`, `dishes`, `orders` and switch to soft delete. **P2 follow-up**, not blocking.

---

## B. Code review (queries, transactions, repositories)

### B.1 Repository scoping — RESOLVED in this refactor

Every repo method takes `restaurantId` and includes it in every WHERE clause, including `findById` (defense in depth: a stale id from another tenant returns null, never leaks).

### B.2 N+1 patterns — none observed

- Order list pre-loads `order_lines` via single `IN (orderIds)` query and groups in JS. ✓
- `included` pattern (JSON:API) batches customer/dish lookups via `findByIds`. ✓
- The Better Auth `getSession` runs on every authenticated request. With `cookieCache.maxAge: 5min` it doesn't always hit the DB — verified config.

### B.3 Transactions

- Order creation: writes order + order_lines in `db.transaction()` ✓
- Restaurant provisioning (new): wraps `restaurants` insert + `restaurant_members` insert in a transaction ✓
- Invitation acceptance: wraps signUp + member insert + invitation `acceptedAt` update in a transaction ✓
- Dish creation: single insert, no transaction needed ✓

### B.4 Race conditions

- **Invitation accept**: defensive check that `acceptedAt` is still null inside the same transaction (`WHERE accepted_at IS NULL` before UPDATE) — prevents two concurrent accepts on the same token from both succeeding.
- **Restaurant provisioning hook**: `provisionFreshRestaurantForUser` does a "row exists?" check inside the transaction before insert. Idempotent on retry.
- **Order create + total_cents**: total computed in TS from line items; if the user submits invalid totals, app rejects. No race vs DB.
- **Dish toggle availability**: simple `UPDATE … SET available = NOT available` — atomic in Postgres.

### B.5 Auth context propagation

`requireRestaurant` middleware runs ONCE per request (after `requireAuth`), does ONE indexed lookup on `restaurant_members(user_id)`, caches result in `c.var.restaurant`. No per-query lookup overhead.

### B.6 Error mapping

`run-query.ts` maps pg error codes (23505 unique violation, 23503 foreign key, 23514 check violation) to `DomainError`. Exposes `pgCode`, `detail`, `constraint` to callers — preserves diagnostic info while hiding query structure from the API consumer.

---

## C. Optimization (indexes, query plans, hot paths)

### C.1 Index coverage — by hot path

| Hot path | Query shape | Index used | Status |
|---|---|---|---|
| List customers paginated + scope | `WHERE restaurant_id = ? AND last_name ILIKE ?` | `customers_restaurant_name_idx (restaurant_id, last_name, first_name)` | ✓ leftmost prefix matches |
| Customer by email | `WHERE restaurant_id = ? AND email ILIKE ?` | `customers_restaurant_email_idx (restaurant_id, email)` | ✓ |
| Customer by phone (digit-normalized) | `WHERE restaurant_id = ? AND regexp_replace(phone, '[^0-9]', '', 'g') ILIKE ?` | none — full scan within tenant | ⚠ acceptable if tenants stay small (<10k customers); for scale, add a generated column `phone_digits text generated always as (regexp_replace(phone, '[^0-9]', '', 'g')) stored` + index. **P2 follow-up** when SLO demands it. |
| List orders by status + date | `WHERE restaurant_id = ? AND status = ? AND created_at >= ?` | `orders_restaurant_status_created_idx (restaurant_id, status, created_at)` | ✓ |
| Orders for a customer | `WHERE restaurant_id = ? AND customer_id = ?` | `orders_customer_idx (customer_id)` + filter on restaurant_id | ⚠ index doesn't include `restaurant_id`; PG will filter after lookup. Fine because customers are already restaurant-scoped (transitively). For belt-and-suspenders: replace with `(restaurant_id, customer_id)`. **P3**. |
| Dishes for a category, available | `WHERE restaurant_id = ? AND category_id = ? AND available = true` | `dishes_restaurant_category_available_idx` | ✓ |
| Notifications inbox | `WHERE restaurant_id = ? AND read_at IS NULL ORDER BY created_at DESC` | `notifications_restaurant_read_created_idx` | ✓ |
| Invitation by token | `WHERE token_hash = ?` | `UNIQUE (token_hash)` | ✓ |
| Pending invites for a restaurant | `WHERE restaurant_id = ? AND accepted_at IS NULL` | `invitations_restaurant_email_idx` (no partial) | ⚠ acceptable; for scale, add `WHERE accepted_at IS NULL` partial. **P3**. |
| Member lookup | `WHERE user_id = ?` | `restaurant_members_user_idx` | ✓ |

### C.2 Recommended follow-up indexes (P2)

```sql
-- Active invitations only — keeps the index hot and tiny.
CREATE UNIQUE INDEX invitations_active_unique
  ON invitations (restaurant_id, lower(email))
  WHERE accepted_at IS NULL;

-- Customer email uniqueness within a tenant.
CREATE UNIQUE INDEX customers_restaurant_email_unique
  ON customers (restaurant_id, lower(email))
  WHERE email IS NOT NULL;
```

These are NOT shipped in `0012` because they require the underlying data to already be conflict-free (otherwise the migration fails). Plan as a follow-up after a one-shot dedup query in production.

### C.3 Connection pool

`db/src/client.ts` uses a single shared `pg.Pool`. Default pool size from `pg` is 10. **Recommendation (P3)**: tune via env (`DATABASE_POOL_MAX`) once load testing data is in. For multi-tenant SaaS, expect 5–20 connections per app instance baseline.

### C.4 VACUUM / autovacuum

Default Postgres autovacuum settings are fine for tables under 1M rows. Hot tables to monitor at scale: `notifications`, `orders`, `order_lines`. Add to runbook: weekly check on `pg_stat_user_tables.n_dead_tup`.

---

## D. Action plan — what was applied, what's deferred

### Applied in this PR

1. ✅ Multi-tenancy schema (restaurants, members, invitations, restaurant_id FKs)
2. ✅ Tenant-scoped indexes on every hot path
3. ✅ Repository scoping by `restaurantId` (defense in depth)
4. ✅ Cascade rules: data follows tenant lifecycle
5. ✅ Provisioning hook for new users + invitation flow
6. ✅ Test fixtures updated to seed a restaurant + member

### Deferred (P2, plan a follow-up migration)

7. ⏳ Partial unique index `customers (restaurant_id, lower(email)) WHERE email IS NOT NULL`
8. ⏳ Partial unique index `invitations (restaurant_id, lower(email)) WHERE accepted_at IS NULL`
9. ⏳ Soft-delete on `customers`, `dishes`, `orders` (compliance)
10. ⏳ `updated_at` auto-update trigger (currently maintained by app code; trigger would be belt-and-suspenders)

### Deferred (P3, only when SLOs demand it)

11. ⏳ Generated `phone_digits` column + index (only when a tenant exceeds ~10k customers)
12. ⏳ UUIDv7 across all tables (perf at very high write volume)
13. ⏳ Pool tuning + autovacuum tuning runbook

---

## E. Skill references applied

- **postgresql-table-design**: tenant scoping pattern, FK cascade strategy, type choices (uuid/text/jsonb/timestamptz), constraint placement (NOT NULL + CHECK + UNIQUE), denormalization trade-off on `order_lines`.
- **postgresql-code-review**: transaction boundaries, race conditions in invitation accept + provisioning, error code mapping, repository defense-in-depth.
- **postgresql-optimization**: composite index left-to-right matching, partial indexes for sparse predicates, generated columns for normalized search, B-tree locality with UUIDv7, pool sizing.
