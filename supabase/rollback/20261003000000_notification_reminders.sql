-- Disposable migration test only.
alter table public.notification_preferences
  drop constraint notification_preferences_work_reminder_minutes_check,
  drop constraint notification_preferences_receivable_due_time_check,
  drop column work_reminder_minutes,
  drop column receivable_due_time,
  alter column receivable_due_day set default false,
  alter column undated_weekly_reminder set default false,
  alter column upcoming_work_reminder set default false;
