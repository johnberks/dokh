# Projeções de Agenda e Finanças (3.11)

As projeções usam as tabelas de Trabalho e Recebível como única fonte de verdade. As views públicas são `security_invoker`, recebem apenas `SELECT` de `authenticated` e preservam RLS das tabelas subjacentes. Elas não materializam nem duplicam dados. Os HTMLs de Agenda, Home e Finanças continuam sendo a referência das futuras telas; esta tarefa não altera UI.

## Consultas

- `receivable_projection`: Recebível com origem (`shift`, `procedure`, `appointment` ou `residency`), competência, data de trabalho, data local de confirmação e `receipt_status` derivado (`invalidated`, `received`, `undated`, `confirmation_pending`, `due_today`, `scheduled`). O “hoje” vem do fuso IANA do perfil, não do servidor em UTC.
- `agenda_work_projection`: Trabalhos não excluídos com Local, cor e Recebível associado. A tela filtra `work_date` por dia/mês e ordena por `start_time nulls last`, depois `created_at`. Residência não aparece na Agenda.
- `finance_month_projection(p_month)`: uma linha para o primeiro dia do mês, mesmo sem valores. `has_expected_entries` distingue mês vazio de `R$ 0` real. `expected_total_cents = received_of_expected_cents + awaiting_of_expected_cents` para os itens previstos naquele mês. `received_in_month_cents` é outra métrica: confirmações cuja data local caiu no mês, mesmo que a previsão fosse de outro mês. `work_generated_cents` usa data do Trabalho, não data prevista. Valores sem previsão ficam fora do caixa e entram em `undated_count`/`undated_total_cents`.
- `finance_month_origins(p_month)`: quatro origens em ordem estável. Para Free, mantém rótulos e retorna quantias `null`; com entitlement ativo, retorna quantias reais do caixa previsto do mês. A UI deve continuar ocultando detalhes Premium conforme o UX.
- `finance_year_projection(p_year)`: somente meses com entrada prevista ou recebimento real, sem barras inventadas. Inclui caixa previsto, confirmação dos itens previstos e recebimento pela data local. `historical_average_cents` fica `null` se houver menos de dois meses históricos com previsão válida; `historical_month_count` explicita a base. A projeção estimada até dezembro continua no fluxo Premium posterior, não é fabricada aqui.

`hourly_value_cents` é `null` no Free e quando não há duração; no Premium ativo, calcula com precisão decimal apenas os Trabalhos com duração, tanto no numerador quanto no denominador. Recebíveis da Residência não compõem `work_generated_cents` nem valor/hora. O espelho de entitlement do servidor é consultado para proteger os números interpretativos; a 5.4 ainda deve integrar/validar a origem desse espelho com RevenueCat.

As funções rejeitam mês que não comece no dia 1, ano fora de 1900–9999 e chamadas sem usuário autenticado. Recebíveis invalidados e Trabalhos excluídos não entram nas somas; a view de Recebíveis ainda expõe o status `invalidated` ao dono para auditoria. Erros de leitura não são estado vazio — o consumidor deve manter essa distinção.

Testes: `supabase/tests/3_11_financial_projections.sql` verifica RLS/anon, status, caixa versus competência, sem data, pendência, Residência, Free/Premium, primeiro mês e virada de ano com fuso. `scripts/test-projections-3.11.mjs` valida PostgREST local com contas descartáveis. A migration foi aplicada apenas no Supabase local, sem reset ou alteração em preview/production.
