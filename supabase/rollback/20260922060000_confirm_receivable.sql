-- Disposable migration test only. Do not roll back production audit data.
drop function public.confirm_receivable_received(uuid);
drop trigger receivables_received_at_immutable on public.receivables;
drop function public.prevent_received_at_rewrite();
