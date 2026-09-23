-- For disposable migration tests only; never roll back production data casually.
drop function public.delete_work_with_receivable(uuid, uuid);
drop function public.update_work_with_receivable(
  uuid, uuid, public.work_entry_type, uuid, text, date, time, integer, text, bigint, date
);
drop function public.create_work_with_receivable(
  uuid, public.work_entry_type, uuid, text, date, time, integer, text, bigint, date
);
drop function private.claim_work_rpc_request(uuid, uuid, text, text);
drop table private.work_rpc_requests;
drop schema private;
