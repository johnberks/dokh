#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_7_7_$$"

if ! [[ "$database" =~ ^dokh_7_7_[0-9]+$ ]]; then
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
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/7_7_received_on.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20261001000000_confirm_receivable_received_on.sql

signature=$(docker exec "$container" psql -U postgres -d "$database" -Atc "select pg_get_function_identity_arguments(p.oid) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'confirm_receivable_received'")
[[ "$signature" == 'p_receivable_id uuid' ]] || { echo "Rollback left signature: $signature" >&2; exit 1; }
echo '7.7 receipt date on confirmation, guards and rollback passed in disposable database'
