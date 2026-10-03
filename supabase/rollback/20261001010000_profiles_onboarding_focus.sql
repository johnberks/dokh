-- Disposable migration test only.
alter table public.profiles drop column onboarding_focus;
drop type public.onboarding_focus;
