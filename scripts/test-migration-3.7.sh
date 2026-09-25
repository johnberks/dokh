#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_3_7_$$"

if ! [[ "$database" =~ ^dokh_3_7_[0-9]+$ ]]; then
  echo 'Invalid disposable database name' >&2
  exit 1
fi

docker exec "$container" createdb -U postgres "$database"
cleanup() { docker exec "$container" dropdb -U postgres --if-exists "$database"; }
trap cleanup EXIT

docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_2_bootstrap.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922000000_profiles_preferences.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922010000_professional_core.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922020000_operational_support.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922030000_rls_complete.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922050000_work_aggregate_rpcs.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_7_work_aggregate_rpcs.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922050000_work_aggregate_rpcs.sql

remaining=$(docker exec "$container" psql -U postgres -d "$database" -Atc "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('create_work_with_receivable', 'update_work_with_receivable', 'delete_work_with_receivable')")
[[ "$remaining" == 0 ]] || { echo 'Rollback left work RPCs behind' >&2; exit 1; }
echo '3.7 work aggregate RPCs, security and rollback passed in disposable database'
