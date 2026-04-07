#!/bin/bash
# ============================================================================
# Auto-run all pending SQL migrations against Neon database
# Usage: DATABASE_URL="postgresql://..." bash scripts/migrate.sh
# ============================================================================
set -euo pipefail

MIGRATIONS_DIR="$(dirname "$0")/migrations"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No migrations directory found, skipping"
  exit 0
fi

# Find all .sql files, sorted by name (timestamp prefix ensures order)
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
  echo "No migration files found, skipping"
  exit 0
fi

# Create tracking table if not exists
psql "$DATABASE_URL" -c "
  CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
  );
" 2>/dev/null

for file in $MIGRATION_FILES; do
  filename=$(basename "$file")

  # Check if already applied
  applied=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM _migrations WHERE filename = '$filename';" 2>/dev/null | tr -d ' ')

  if [ "$applied" = "1" ]; then
    echo "SKIP: $filename (already applied)"
    continue
  fi

  echo "APPLYING: $filename ..."
  psql "$DATABASE_URL" -f "$file"

  # Record migration
  psql "$DATABASE_URL" -c "INSERT INTO _migrations (filename) VALUES ('$filename');"
  echo "DONE: $filename"
done

echo "All migrations complete."
