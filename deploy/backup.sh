#!/bin/bash
# =========================================
# PostgreSQL + Strapi Uploads Backup Script
# Run via cron: 0 3 * * * /home/strapi/backup.sh
# =========================================

set -euo pipefail

# --- Configuration ---
BACKUP_DIR="/home/strapi/backups"
STRAPI_DIR="/home/strapi/tehnicki_pregled/strapi"
DB_NAME="strapi"
DB_USER="strapi"
RETENTION_DAYS=14
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# --- Create backup directory ---
mkdir -p "$BACKUP_DIR"

# --- PostgreSQL dump ---
echo "[$DATE] Starting PostgreSQL backup..."
pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_DIR/db_$DATE.dump"

# --- Strapi uploads backup ---
if [ -d "$STRAPI_DIR/public/uploads" ]; then
  echo "[$DATE] Backing up uploads..."
  tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$STRAPI_DIR/public" uploads/
fi

# --- Remove old backups ---
echo "[$DATE] Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "db_*.dump" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "[$DATE] Backup completed successfully."
echo "  DB:      $BACKUP_DIR/db_$DATE.dump"
echo "  Uploads: $BACKUP_DIR/uploads_$DATE.tar.gz"
