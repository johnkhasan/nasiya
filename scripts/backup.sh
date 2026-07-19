#!/bin/bash
# Runs on the server (crontab for the `deploy` user). Assumes this repo is
# checked out at /home/deploy/nasiya and backups go to /home/deploy/backups.
set -euo pipefail

DATE=$(date +%F_%H%M)
BACKUP_DIR=/home/deploy/backups
mkdir -p "$BACKUP_DIR"

docker compose -f /home/deploy/nasiya/docker-compose.yml exec -T db \
  pg_dump -U nasiya nasiya | gzip > "$BACKUP_DIR/nasiya_$DATE.sql.gz"

# Keep 14 days of local backups.
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete
