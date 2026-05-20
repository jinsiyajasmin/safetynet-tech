#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Set it in Coolify / .env (PostgreSQL connection string)."
  exit 1
fi

/app/docker-migrate.sh

echo "Seeding default client and superadmin (idempotent)..."
if ! node /app/prisma/seed.js; then
  echo "WARN: Superadmin seed failed; API will still start (check DATABASE_URL and SUPERADMIN_* env vars)."
fi

echo "Starting API server..."
exec node server.js
