#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_3_11_$$"

if ! [[ "$database" =~ ^dokh_3_11_[0-9]+$ ]]; then
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
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922060000_confirm_receivable.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922070000_residency_free.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922071000_residency_extension_job.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922072000_residency_worker_lock.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/migrations/20260922080000_financial_projections.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_11_financial_projections.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922080000_financial_projections.sql

remaining=$(docker exec "$container" psql -U postgres -d "$database" -Atc "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('agenda_work_projection', 'receivable_projection')")
[[ "$remaining" == 0 ]] || { echo 'Rollback left projection views behind' >&2; exit 1; }
echo '3.11 projections, security and rollback passed in disposable database'
