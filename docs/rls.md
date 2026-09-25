# Contrato de acesso ao banco (3.5)

Todas as 12 tabelas de usuário em `public` têm RLS e uma policy de ownership
baseada em `auth.uid() = user_id`. `profiles.user_id` é gerado de `id`; o cliente
não define o dono. O teste `supabase/tests/3_5_rls_matrix.sql` executa a matriz
em banco descartável para anônimo, dono, outra conta e `service_role`.

| Tabelas | Cliente autenticado | `service_role` |
| --- | --- | --- |
| `profiles`, `work_preferences`, `notification_preferences`, `device_push_tokens` | CRUD apenas nas próprias linhas | CRUD |
| `work_locations`, `work_series`, `work_entries`, `residencies`, `receivables` | Leitura apenas das próprias linhas; escrita via RPC transacional futura | CRUD |
| `subscription_entitlements`, `imports`, `import_issues` | Leitura apenas das próprias linhas; escrita via Edge Function/RPC futura | CRUD |

Anônimo não tem acesso às tabelas. Nenhum papel cliente tem `TRUNCATE`,
`REFERENCES`, `TRIGGER` ou `MAINTAIN`; RLS sozinha não protege `TRUNCATE`.
`service_role` pode contornar RLS por definição do Supabase, mas só pode estar em
Edge Functions, nunca no bundle mobile. A função servidora ainda precisa validar
identidade, ownership e operação antes de usar esse papel.

Não há views públicas nesta fase. Qualquer view futura que exponha dados de
usuário deve usar `WITH (security_invoker = true)`; materialized views não devem
ser legíveis pelos papéis cliente. A suíte SQL verifica essas duas condições.
Uma migration futura deve ativar RLS na nova tabela e conceder apenas os verbos
necessários: os grants padrão para tabelas criadas como `postgres` foram
restringidos de propósito. A auditoria de 3.5 deve ser ampliada ao adicionar
novas tabelas, views ou RPCs.
