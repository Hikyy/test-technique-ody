# @ody/db

PostgreSQL schema, migrations (node-pg-migrate, style Laravel artisan), and seed for **Sève**.

## Setup

1. Copy env: `cp .env.example .env` and adjust `PG_*` to match `compose.yml`.
2. Start Postgres: `docker compose up -d postgres` (from repo root).
3. Install deps (from repo root): `pnpm install`.

## Migrations (Laravel-style, 1 fichier = 1 changement)

Stack: [`node-pg-migrate`](https://salsita.github.io/node-pg-migrate/) — chaque migration est un fichier TS isolé avec `up()`/`down()`. L'ORM Drizzle reste utilisé pour les requêtes runtime (`apps/api`), mais le migrator est node-pg-migrate.

```bash
pnpm db:make create_invoices_table   # génère db/migrations/<timestamp>_create-invoices-table.ts
pnpm db:migrate                      # applique toutes les migrations en attente (alias: db:up)
pnpm db:down                         # rollback de la dernière migration
pnpm db:redo                         # rollback puis re-applique
pnpm db:status                       # liste les migrations en attente (dry-run)
pnpm db:seed                         # truncate + populate Sève demo data
```

Sous le capot : `node scripts/migrate.mjs <cmd>` charge `.env`, construit `DATABASE_URL` depuis `PG_HOST/PORT/USER/PASS/DB`, puis délègue à `node-pg-migrate`. Config dans `.pgmrc.json`.

### Format d'une migration

```ts
import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("invoices", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    amount_cents: { type: "integer", notNull: true },
    created_at: { type: "timestamp with time zone", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("invoices", "created_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("invoices");
}
```

## Demo credentials (after seed)

- Email: `chef@seve.fr`
- Password: `seve2026` (bcrypt-hashed in `accounts.password`, `provider_id='credential'`)

## Notes

- Money is stored as `integer` cents only — never decimals.
- Order status is a `text` column with a CHECK constraint (`pending|cooking|sent|served|cancelled`) for portability over native enums.
- `restaurant_settings` is a singleton (`id='default'`).
- Le schéma Drizzle (`src/schema.ts`) doit être tenu en cohérence manuellement avec les migrations (séparation explicite ORM/migrator).
