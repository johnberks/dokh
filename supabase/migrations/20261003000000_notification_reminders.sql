-- 12.1/12.3/12.4: lembretes ligados por padrão (pedido do usuário, 2026-10-03; Perfil 14 desenha
-- os quatro toggles ligados) e personalização do horário do aviso de entrada e da antecedência
-- do lembrete de Trabalho. Até aqui não existia tela para mudar essas preferências: as linhas
-- já gravadas só podem vir do seed ou de testes, então passam para os novos padrões.
-- `important_work_changes` continua desligado: o evento ainda não tem definição de produto.

alter table public.notification_preferences
  alter column receivable_due_day set default true,
  alter column undated_weekly_reminder set default true,
  alter column upcoming_work_reminder set default true,
  add column receivable_due_time time not null default '08:00',
  add column work_reminder_minutes integer not null default 120;

alter table public.notification_preferences
  add constraint notification_preferences_receivable_due_time_check
    check (receivable_due_time = date_trunc('minute', receivable_due_time)
      and receivable_due_time between '05:00' and '22:00'),
  add constraint notification_preferences_work_reminder_minutes_check
    check (work_reminder_minutes in (30, 60, 120, 1440));

update public.notification_preferences
set receivable_due_day = true,
  undated_weekly_reminder = true,
  upcoming_work_reminder = true;

comment on column public.notification_preferences.receivable_due_time is
  'Hora local do aviso no dia previsto da entrada (12.4).';
comment on column public.notification_preferences.work_reminder_minutes is
  'Antecedência do lembrete de Trabalho com horário: 30, 60, 120 minutos ou 1440 (um dia) (12.3).';
