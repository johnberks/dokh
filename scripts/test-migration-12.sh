#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_12_$$"

if ! [[ "$database" =~ ^dokh_12_[0-9]+$ ]]; then
  echo 'Invalid disposable database name' >&2
  exit 1
fi

docker exec "$container" createdb -U postgres "$database"
cleanup() { docker exec "$container" dropdb -U postgres --if-exists "$database"; }
trap cleanup EXIT

docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_2_bootstrap.sql
for migration in supabase/migrations/2026*.sql; do
  # Storage depende do esquema `storage` do Supabase, ausente no banco descartável (ver 3.6).
  [[ "$migration" == *_private_storage.sql ]] && continue
  docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < "$migration" > /dev/null
done
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/12_notification_reminders.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20261003000000_notification_reminders.sql

columns=$(docker exec "$container" psql -U postgres -d "$database" -Atc "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'notification_preferences' and column_name in ('receivable_due_time', 'work_reminder_minutes')")
[[ "$columns" == 0 ]] || { echo 'Rollback left reminder columns behind' >&2; exit 1; }
echo '12 reminder defaults, customization checks, RLS and rollback passed in disposable database'
