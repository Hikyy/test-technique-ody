#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "▸ running migrations…"
  cd /app/db && node scripts/migrate.mjs up && cd /app
fi

if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "▸ seeding database…"
  node /app/apps/api/dist/scripts/seed.js || true
fi

exec "$@"
