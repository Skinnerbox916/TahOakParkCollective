#!/bin/sh
# Production entrypoint: apply pending Prisma migrations, then start Next.
# If a migration fails the container exits, the healthcheck never passes, and
# Coolify keeps the previous container running.
set -e

if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  echo "[entrypoint] Applying database migrations..."
  (cd /app/migrate && node node_modules/prisma/build/index.js migrate deploy)
fi

exec node server.js
