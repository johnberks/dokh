-- Disposable-test rollback only. Production migrations are never rolled back.
drop function public.finance_year_projection(integer);
drop function public.finance_month_origins(date);
drop function public.finance_month_projection(date);
drop view public.agenda_work_projection;
drop view public.receivable_projection;
