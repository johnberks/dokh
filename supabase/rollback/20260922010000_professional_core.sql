-- Test-only rollback after the matching migration, in a disposable database.
drop table public.receivables;
drop table public.work_entries;
drop function public.validate_active_work_location();
drop table public.residencies;
drop table public.work_series;
drop table public.work_locations;
drop type public.work_entry_source;
drop type public.work_entry_type;
drop type public.work_series_frequency;
drop type public.work_location_color_source;
