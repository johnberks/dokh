# Residência recorrente Free (3.9)

Residência é uma fonte mensal de Recebíveis, separada de Trabalho. Não cria `work_entries` nem `work_series`, não consulta `subscription_entitlements` e não exige Premium. As telas futuras devem seguir `design/onboarding.html`, `design/perfil.html`, `design/home.html`, `design/financas.html` e seus UX; esta tarefa não altera UI.

## Contrato das RPCs

- `create_or_update_residency(p_residency_id, p_specialty, p_institution, p_level_label, p_starts_on, p_expected_ends_on, p_monthly_amount_cents, p_payment_day)` cria ou edita atomicamente a Residência ativa e seus Recebíveis. `p_residency_id = null` reutiliza a Residência ativa da própria pessoa, se existir; se não existir, cria uma. Um ID explícito deve apontar para a Residência ativa do dono. Retorna ID e quantidade de Recebíveis criados/alterados.
- `generate_residency_receivables(p_residency_id)` estende, de forma idempotente, a janela da Residência ativa do dono. Retorna a quantidade de linhas criadas/alteradas. Pode ser chamada novamente após reconexão; o job privado também a estende sem exigir que o app esteja aberto.
- `deactivate_residency(p_residency_id)` desativa a configuração e invalida apenas Recebíveis futuros não recebidos. É idempotente para a mesma Residência; o histórico recebido permanece. A eventual confirmação visual da desativação pertence à tarefa de tela, não a esta RPC.

As RPCs públicas obtêm o usuário de `auth.uid()` e exigem perfil com fuso IANA. Não recebem `user_id` nem data atual do cliente. Escrita direta nas tabelas continua fechada ao app por RLS/grants. Uma pessoa tem no máximo uma Residência ativa; chamadas de criação simultâneas são serializadas por usuário.

## Calendário e reconciliação

O mês de início e o de término previsto são inclusivos. Sem término, são materializados o mês atual e 12 meses à frente, respeitando `starts_on`; se o início for anterior, o cadastro inicial também gera os meses históricos desde ele. O dia de pagamento de 1 a 31 é limitado ao último dia real de cada mês — 31/01, 29/02 em ano bissexto e 28/02 em ano comum. `expected_on` é `date`, sem conversão de fuso; o “hoje” usado para distinguir futuro vem do fuso salvo no perfil.

Ao editar valor, dia ou limites, somente linhas com `received_at is null` e `expected_on > hoje` são atualizadas/invalidadas. Linhas já recebidas ou cujo vencimento não é futuro mantêm valor, data e auditoria. Ao estender novamente um limite, uma linha futura invalidada pode ser reativada; não se cria duplicata por `(residency_id, competence_month)`. Nenhuma geração define `received_at` automaticamente.

Um job privado do Supabase Cron roda diariamente às 03:15 UTC para manter a janela de Residências sem término mesmo sem acesso ao app; cada pessoa usa seu fuso na geração. A rotina pode ser repetida com resultado zero. A verificação SQL usa banco descartável, e o teste local confere que o job está registrado no banco principal. A configuração segue o [modelo oficial de job SQL do Supabase](https://supabase.com/docs/guides/cron/quickstart).

`supabase/tests/3_9_residency_free.sql` cobre ano bissexto e comum, Free sem `work_series`/entitlement, idempotência, concorrência lógica, ownership, histórico recebido, edição, desativação e worker. `scripts/test-residency-rpcs-3.9.mjs` cobre PostgREST local com duas criações simultâneas, calendário, isolamento e desativação. Migrations foram aplicadas apenas no Supabase local, sem reset ou alteração em preview/production.
