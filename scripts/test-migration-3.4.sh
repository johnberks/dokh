#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_3_4_$$"

if ! [[ "$database" =~ ^dokh_3_4_[0-9]+$ ]]; then
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
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_4_operational_constraints_rls.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922020000_operational_support.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922010000_professional_core.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922000000_profiles_preferences.sql

remaining=$(docker exec "$container" psql -U postgres -d "$database" -Atc "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('subscription_entitlements', 'device_push_tokens', 'imports', 'import_issues')")
[[ "$remaining" == 0 ]] || { echo 'Rollback left operational tables behind' >&2; exit 1; }
echo '3.4 up, constraints, idempotency, RLS and down passed in disposable database'
