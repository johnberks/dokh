#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
container=supabase_db_dokh

# Seed the real local Auth schema inside one transaction and always roll back.
# This preserves the developer's running local database, even on assertion errors.
{
  printf 'begin;\n'
  sed -n '1,$p' supabase/seed.sql
  sed -n '1,$p' supabase/seed.sql
  sed -n '1,$p' supabase/tests/3_12_seed.sql
  printf 'rollback;\n'
} | docker exec -i "$container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres >/dev/null

echo '3.12 synthetic seed, design states, auth identities and RLS passed (rolled back)'
