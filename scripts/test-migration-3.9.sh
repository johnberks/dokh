#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_3_9_$$"

if ! [[ "$database" =~ ^dokh_3_9_[0-9]+$ ]]; then
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
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_9_residency_free.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922071000_residency_extension_job.sql
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/rollback/20260922070000_residency_free.sql

remaining=$(docker exec "$container" psql -U postgres -d "$database" -Atc "select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'private') and p.proname in ('create_or_update_residency', 'generate_residency_receivables', 'deactivate_residency', 'sync_residency_receivables', 'extend_all_residency_receivables')")
[[ "$remaining" == 0 ]] || { echo 'Rollback left residency functions behind' >&2; exit 1; }
scheduled=$(docker exec "$container" psql -U postgres -d postgres -Atc "select count(*) from cron.job where jobname = 'dokh-residency-extension' and schedule = '15 3 * * *' and active and command = 'select private.extend_all_residency_receivables()'")
[[ "$scheduled" == 1 ]] || { echo 'Scheduled residency extension job is missing' >&2; exit 1; }
echo '3.9 Free residency generation, reconciliation and rollback passed in disposable database'
