-- Disposable-test rollback only. Production migrations are never rolled back.
do $$
begin
  if current_database() = 'postgres' then
    if exists (select 1 from cron.job where jobname = 'dokh-residency-extension') then
      perform cron.unschedule('dokh-residency-extension');
    end if;
  end if;
end;
$$;
drop function private.extend_all_residency_receivables();
