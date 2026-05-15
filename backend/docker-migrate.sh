#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Set it in Coolify / .env (PostgreSQL connection string)."
  exit 1
fi

echo "Running Prisma migrations..."

# Neon / Coolify often reuse a DB that already has tables but no _prisma_migrations rows.
# Baselining first avoids Prisma P3005 ("database schema is not empty").
STATE="$(node prisma-baseline.js 2>/dev/null || echo "client=0 lastLogin=0")"
echo "Database state: $STATE"

baseline_migration() {
  migration_name="$1"
  echo "Marking migration as applied: $migration_name"
  npx prisma migrate resolve --applied "$migration_name" 2>/dev/null || true
}

if echo "$STATE" | grep -q 'client=1'; then
  echo "Existing schema detected (Client table). Baselining init migration..."
  baseline_migration "20250513180000_init"
fi

if echo "$STATE" | grep -q 'lastLogin=1'; then
  echo "Existing lastLoginAt column detected. Baselining user_last_activity migration..."
  baseline_migration "20260513120000_user_last_activity"
fi

set +e
MIGRATION_OUTPUT="$(npx prisma migrate deploy 2>&1)"
MIGRATION_EXIT_CODE=$?
set -e

echo "$MIGRATION_OUTPUT"

if [ "$MIGRATION_EXIT_CODE" -ne 0 ]; then
  if echo "$MIGRATION_OUTPUT" | grep -q 'P3005'; then
    echo "Prisma P3005: non-empty database without migration history. Baselining and retrying..."
    baseline_migration "20250513180000_init"
    if echo "$STATE" | grep -q 'lastLogin=1'; then
      baseline_migration "20260513120000_user_last_activity"
    fi
    npx prisma migrate deploy
  else
    exit "$MIGRATION_EXIT_CODE"
  fi
fi
