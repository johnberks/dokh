-- For disposable migration tests only; never roll back production data casually.
-- Postgres cannot drop an enum value: rebuild the type without 'specialist'.
-- Fails on purpose (cast error) if any profile is still a specialist.
alter table public.profiles drop constraint profiles_specialty_by_status;
alter type public.professional_status rename to professional_status_11_10;
create type public.professional_status as enum ('general_practitioner', 'resident');
alter table public.profiles
  alter column professional_status type public.professional_status
  using professional_status::text::public.professional_status;
drop type public.professional_status_11_10;
alter table public.profiles add constraint profiles_specialty_by_status check (
  (professional_status = 'resident' and specialty is not null and specialty = btrim(specialty) and specialty <> '')
  or (professional_status = 'general_practitioner' and specialty is null)
);
