-- For disposable migration tests only; never roll back production data casually.
drop function public.delete_work_series_from(uuid);
