-- 3.5: least-privilege table grants around the existing ownership policies.
-- In particular, Supabase's default grants include TRUNCATE/REFERENCES/TRIGGER;
-- TRUNCATE is not governed by row-level security.
revoke all on table public.profiles, public.work_preferences, public.notification_preferences,
  public.work_locations, public.work_series, public.work_entries, public.residencies,
  public.receivables, public.subscription_entitlements, public.device_push_tokens,
  public.imports, public.import_issues from public, anon, authenticated, service_role;

grant select, insert, update, delete on table public.profiles, public.work_preferences,
  public.notification_preferences, public.device_push_tokens to authenticated;
grant select on table public.work_locations, public.work_series, public.work_entries,
  public.residencies, public.receivables, public.subscription_entitlements,
  public.imports, public.import_issues to authenticated;
grant select, insert, update, delete on table public.profiles, public.work_preferences,
  public.notification_preferences, public.work_locations, public.work_series,
  public.work_entries, public.residencies, public.receivables,
  public.subscription_entitlements, public.device_push_tokens, public.imports,
  public.import_issues to service_role;

-- These helpers are invoked by existing triggers, not public RPC endpoints.
revoke execute on function public.set_updated_at(), public.validate_profile_timezone(),
  public.validate_active_work_location() from public, anon, authenticated;

-- Future migrations executed as postgres must opt in to client access. They
-- must enable RLS and grant each operation explicitly in their own migration.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select, update on sequences to service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
