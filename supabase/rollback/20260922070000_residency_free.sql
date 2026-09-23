-- Disposable-test rollback only. Production migrations are never rolled back.
drop function public.deactivate_residency(uuid);
drop function public.generate_residency_receivables(uuid);
drop function public.create_or_update_residency(uuid, text, text, text, date, date, bigint, smallint);
drop function private.sync_residency_receivables(uuid, date, date);
