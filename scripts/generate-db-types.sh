#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
target=src/data/database.types.ts
generated=$(mktemp)
trap 'rm -f "$generated"' EXIT

SUPABASE_TELEMETRY_DISABLED=1 npx supabase gen types typescript --local --schema public \
  | npx biome format --stdin-file-path "$target" > "$generated"
test -s "$generated"
mv "$generated" "$target"
echo "Generated $target from local Supabase"
