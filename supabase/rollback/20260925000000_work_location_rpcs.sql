-- For disposable migration tests only; never roll back production data casually.
drop function public.archive_work_location(uuid);
drop function public.update_work_location(
  uuid, text, text, text, public.work_location_color_source
);
drop function public.create_work_location(text, text, text, public.work_location_color_source);
drop function private.assert_work_location_color(uuid, text, public.work_location_color_source);
