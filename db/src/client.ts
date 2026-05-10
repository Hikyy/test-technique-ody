import "dotenv/config";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

const host = process.env.PG_HOST ?? "localhost";
const port = Number(process.env.PG_PORT ?? 5432);
const user = process.env.PG_USER ?? "ody";
const password = process.env.PG_PASS ?? "ody";
const database = process.env.PG_DB ?? "ody";

export const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export async function closeDb(): Promise<void> {
  await pool.end();
}

export type Database = typeof db;
export { schema };
