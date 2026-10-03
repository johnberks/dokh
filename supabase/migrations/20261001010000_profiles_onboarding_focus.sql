-- 7.7 (Onboarding v2, D-1): o que a pessoa mais quer organizar com a DOKH. Personaliza a
-- narrativa do onboarding, a ordem da primeira visão e o primeiro passo do guia. Opcional:
-- contas criadas antes desta pergunta seguem sem foco e o app usa o comportamento padrão.
create type public.onboarding_focus as enum ('work', 'receivables', 'earnings');

alter table public.profiles add column onboarding_focus public.onboarding_focus;

comment on column public.profiles.onboarding_focus is
  'Foco escolhido no onboarding (trabalhos, recebimentos ou ganhos); nulo para contas antigas.';
