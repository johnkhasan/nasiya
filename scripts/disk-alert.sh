#!/bin/bash
# Runs on the server (crontab, hourly). Requires BOT_TOKEN and ADMIN_CHAT_ID
# exported in the same crontab or sourced from an env file.
set -euo pipefail

THRESHOLD=85
USAGE=$(df / --output=pcent | tail -1 | tr -dc '0-9')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  curl -s "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d chat_id="${ADMIN_CHAT_ID}" \
    -d text="⚠️ Server disk: ${USAGE}%"
fi
