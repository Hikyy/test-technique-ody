#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbRoot = resolve(__dirname, "..");

const envFile = resolve(dbRoot, ".env");
if (existsSync(envFile)) loadEnv({ path: envFile });

const host = process.env.PG_HOST ?? "localhost";
const port = process.env.PG_PORT ?? "5432";
const user = process.env.PG_USER ?? "ody";
const pass = process.env.PG_PASS ?? "ody";
const database = process.env.PG_DB ?? "ody";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${database}`;
}

const candidates = [
  resolve(dbRoot, "node_modules/.bin/node-pg-migrate"),
  resolve(dbRoot, "../node_modules/.bin/node-pg-migrate"),
];
const bin = candidates.find(existsSync);
if (!bin) {
  console.error("node-pg-migrate binary not found. Searched:", candidates);
  process.exit(127);
}
const args = process.argv.slice(2);

const res = spawnSync(bin, args, { stdio: "inherit", cwd: dbRoot, env: process.env });
process.exit(res.status ?? 1);
