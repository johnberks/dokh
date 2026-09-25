-- Test-only rollback, in a disposable database without live import data.
drop index public.work_entries_import_row_idx;
alter table public.work_entries drop constraint work_entries_import_owner;
alter table public.work_entries drop constraint work_entries_import_origin;
alter table public.work_entries drop column import_row_key;
drop table public.import_issues;
drop table public.imports;
drop table public.device_push_tokens;
drop table public.subscription_entitlements;
drop type public.import_status;
drop type public.import_source;
drop type public.device_platform;
drop type public.subscription_environment;
drop type public.subscription_store;
