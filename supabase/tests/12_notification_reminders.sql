-- Run in a disposable database after all migrations through 12 (notification reminders).
begin;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');
insert into public.notification_preferences (user_id) values
  ('00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022');

do $$
declare
  v_time_denied boolean := false;
  v_minutes_denied boolean := false;
begin
  assert (select receivable_due_day and undated_weekly_reminder and upcoming_work_reminder
    and not important_work_changes and receivable_due_time = '08:00' and work_reminder_minutes = 120
    from public.notification_preferences where user_id = '00000000-0000-0000-0000-000000000011'),
    'new rows must start with the reminders on';
  begin
    update public.notification_preferences set receivable_due_time = '03:00'
    where user_id = '00000000-0000-0000-0000-000000000011';
  exception when check_violation then v_time_denied := true;
  end;
  assert v_time_denied, 'reminder time outside 05:00–22:00 accepted';
  begin
    update public.notification_preferences set work_reminder_minutes = 45
    where user_id = '00000000-0000-0000-0000-000000000011';
  exception when check_violation then v_minutes_denied := true;
  end;
  assert v_minutes_denied, 'unknown reminder lead accepted';
end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
update public.notification_preferences
set receivable_due_day = false, receivable_due_time = '07:30', work_reminder_minutes = 1440
where user_id in ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000022');
reset role;

do $$
begin
  assert (select not receivable_due_day and receivable_due_time = '07:30'
    and work_reminder_minutes = 1440
    from public.notification_preferences where user_id = '00000000-0000-0000-0000-000000000011'),
    'owner could not customize reminders';
  assert (select receivable_due_day and work_reminder_minutes = 120
    from public.notification_preferences where user_id = '00000000-0000-0000-0000-000000000022'),
    'RLS let another user change reminders';
end $$;

rollback;
