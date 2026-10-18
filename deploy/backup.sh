#!/bin/sh
# Dedicated deployment database only. Store copies off-host for disaster recovery.
set -eu
umask 077
cd "$(dirname "$0")/.."
mkdir -p backups
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file="backups/healthbridge-$backup_stamp.dump"
sudo -n docker compose --env-file .env -f deploy/compose.server.yml exec -T db \
    pg_dump -U healthbridge -d healthbridge -Fc > "$backup_file.partial"
[ -s "$backup_file.partial" ]
mv "$backup_file.partial" "$backup_file"
printf 'Created %s\n' "$backup_file"
