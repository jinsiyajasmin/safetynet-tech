#!/bin/sh
set -e
cd /app

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Set it in Coolify / .env (PostgreSQL connection string)."
  exit 1
fi

./docker-migrate.sh

echo "Starting API server..."
exec node server.js
