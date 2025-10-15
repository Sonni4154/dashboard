#!/bin/bash

# QuickBooks OAuth 2.0 - Quick Migration Script
# This script runs the database migration to add new OAuth fields

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  QuickBooks OAuth 2.0 - Database Migration"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set in environment"
    echo "Loading from env.production..."
    # shellcheck source=env.production
    source <(grep DATABASE_URL env.production | sed 's/^/export /')
fi

echo "✓ Using database: $(echo "$DATABASE_URL" | sed 's/:[^:]*@/:****@/')"
echo ""

# Check if migration file exists
if [ ! -f "db/migrations/002_update_tokens_table.sql" ]; then
    echo "✗ Migration file not found: db/migrations/002_update_tokens_table.sql"
    exit 1
fi

echo "✓ Migration file found"
echo ""

# Backup reminder
echo "⚠️  IMPORTANT: Backup your database before proceeding!"
echo ""
read -p "Have you backed up your database? (yes/no): " -n 3 -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Please backup first with:"
    echo "  pg_dump \"\$DATABASE_URL\" > backup_\$(date +%Y%m%d_%H%M%S).sql"
    exit 1
fi

echo ""
echo "Running migration..."
echo "─────────────────────────────────────────────────────────"

# Run migration
psql "$DATABASE_URL" -f "db/migrations/002_update_tokens_table.sql"

echo "─────────────────────────────────────────────────────────"
echo ""
echo "✓ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Rebuild backend: npm run build"
echo "2. Restart backend: pm2 restart backend"
echo "3. Initialize tokens: node init-tokens-from-refresh.js"
echo ""

