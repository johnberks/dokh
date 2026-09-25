#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh
database="dokh_3_5_$$"

if ! [[ "$database" =~ ^dokh_3_5_[0-9]+$ ]]; then
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
docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d "$database" < supabase/tests/3_5_rls_matrix.sql

echo '3.5 ownership, least-privilege grants, service role and views passed in disposable database'
