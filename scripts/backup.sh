#!/bin/bash
# Runs on the server (crontab for the `deploy` user).
set -euo pipefail

PROJECT_DIR="${NASIYA_DIR:-/srv/nasiya}"
BACKUP_DIR="${NASIYA_BACKUP_DIR:-/home/deploy/backups}"
DATE=$(date +%F_%H%M)
mkdir -p "$BACKUP_DIR"

docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  pg_dump -U nasiya nasiya | gzip > "$BACKUP_DIR/nasiya_$DATE.sql.gz"

# Keep 14 days of local backups.
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete
