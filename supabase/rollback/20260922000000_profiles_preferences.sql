-- Test-only rollback, run solely in a disposable database after the matching migration.
drop table public.notification_preferences;
drop table public.work_preferences;
drop table public.profiles;
drop function public.validate_profile_timezone();
drop function public.set_updated_at();
drop type public.professional_status;
