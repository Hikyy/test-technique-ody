#!/bin/sh
set -e
cd /app

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "▸ running migrations…"
  ( cd /app/db && node scripts/migrate.mjs up )
fi

if [ "${RUN_SEED:-0}" = "1" ] && [ -f /app/apps/api/dist/scripts/seed.js ]; then
  echo "▸ seeding database…"
  node /app/apps/api/dist/scripts/seed.js || echo "(seed skipped)"
fi

exec "$@"
