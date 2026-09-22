# Modelo de domínio — DOKH

## Finalidade

Este documento é a fonte de verdade para entidades, relações, estados e cálculos do domínio. Ele deve ser lido antes de qualquer migration, query, formulário ou regra financeira.

Os nomes do banco e do código usam inglês em `snake_case`. A interface usa português do Brasil.

## Princípios

1. Supabase/Postgres é a única fonte de verdade dos dados de domínio.
2. Agenda, Home e Finanças são projeções do mesmo conjunto de dados; não mantêm cópias independentes.
3. Um Trabalho representa uma ocorrência profissional. Sua dimensão financeira é um Recebível ligado a ele.
4. Residência é uma configuração recorrente distinta de Trabalho e gera Recebíveis mensais.
5. Valores monetários são inteiros em centavos. Nunca usar `float`.
6. Datas de pagamento são `date`, não timestamp, para não mudar de dia por fuso horário.
7. Horários profissionais são armazenados com data local, hora local, duração e fuso IANA.
8. Status que pode ser derivado não deve ser persistido.
9. Toda escrita que afeta mais de uma tabela é atômica por função SQL/RPC ou Edge Function.
10. Toda tabela de usuário possui `user_id` e RLS.

## Glossário

| Termo de produto | Nome técnico | Definição |
| --- | --- | --- |
| Trabalho | `work_entries` | Uma ocorrência de Plantão, Procedimento ou Atendimento. |
| Série recorrente | `work_series` | Regra Premium que materializa vários Trabalhos. |
| Local | `work_locations` | Hospital, clínica, consultório ou outro local reutilizável. |
| Residência | `residencies` | Configuração profissional que gera renda mensal recorrente. |
| Entrada/Recebível | `receivables` | Valor com data prevista opcional e confirmação de recebimento. |
| Trabalho gerado | Projeção por competência | Soma dos Trabalhos realizados no período. |
| Previsto para entrar | Projeção por caixa | Soma dos Recebíveis cuja data prevista cai no período. |
| Sem data | Status derivado | Recebível existente sem `expected_on`. |
| Confirmação pendente | Status derivado | Data prevista passou e ainda não há `received_at`. |

## Agregados

### Trabalho

O agregado Trabalho é composto por:

- uma linha em `work_entries`;
- exatamente um Recebível em `receivables`;
- opcionalmente um Local;
- opcionalmente uma Série recorrente.

Criar, editar ou excluir um Trabalho atualiza sua ocorrência e seu Recebível na mesma transação. Agenda lê a ocorrência; Finanças lê o Recebível e os campos de competência do Trabalho.

### Residência

O agregado Residência é composto por:

- uma linha ativa em `residencies` por usuário;
- Recebíveis mensais em `receivables`, um por competência mensal.

Residência não aparece como Trabalho na Agenda. Seus Recebíveis aparecem em Home e Finanças.

Esta recorrência é sempre Free. Ela é uma consequência automática do cadastro da residência e não passa por `work_series`, não exige entitlement e não deve ser apresentada como benefício Premium. O único recorrente gratuito do MVP é a bolsa mensal da residência.

## Entidades e tabelas

### `profiles`

Uma linha por usuário autenticado.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK e FK para `auth.users.id`. |
| `display_name` | `text` | Obrigatório; nome usado na interface. |
| `graduation_year` | `smallint` | Opcional até completar o perfil. |
| `professional_status` | enum | `general_practitioner` ou `resident`. |
| `specialty` | `text` | Obrigatório quando `professional_status = resident`. |
| `city` | `text` | Opcional. |
| `country_code` | `char(2)` | Padrão `BR` no MVP. |
| `locale` | `text` | Padrão `pt-BR`. |
| `timezone` | `text` | IANA; padrão detectado no device. |
| `avatar_path` | `text` | Caminho privado no Supabase Storage. |
| `onboarding_completed_at` | `timestamptz` | Nulo enquanto onboarding não terminou. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

Restrições:

- `graduation_year` deve ser plausível e não maior que o ano corrente.
- Especialidade deve ser nula para generalista.
- E-mail e método de acesso vêm do Supabase Auth, não são duplicados aqui.

### `work_locations`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `name` | `text` | Obrigatório, trim, não vazio. |
| `city` | `text` | Opcional. |
| `color_token` | `text` | Token da paleta, nunca hexadecimal arbitrário vindo do cliente. |
| `color_source` | enum | `automatic`, `free_palette` ou `premium_palette`. |
| `archived_at` | `timestamptz` | Remoção lógica; preserva histórico. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

Regras:

- Nomes podem se repetir; não deduplicar automaticamente.
- Arquivar remove o local dos seletores futuros, mas Trabalhos históricos mantêm a referência e o nome.
- Uso de `premium_palette` exige entitlement Premium no servidor.

### `work_preferences`

Uma linha por usuário.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `user_id` | `uuid` | PK/FK. |
| `default_duration_minutes` | `integer` | Nulo ou positivo. |
| `default_start_time` | `time` | Opcional. |
| `default_payment_term_days` | `smallint` | Nulo, 30, 60 ou 90 no MVP. |
| `updated_at` | `timestamptz` | Auditoria. |

Preferências apenas preenchem sugestões. Nunca sobrescrevem silenciosamente um Trabalho existente.

### `work_series`

Regra Premium de recorrência de Trabalho. Não é usada pela residência.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `frequency` | enum | `weekly`, `biweekly`, `monthly` ou `custom`. |
| `rrule` | `text` | Regra RFC 5545 normalizada. |
| `timezone` | `text` | Fuso usado para gerar ocorrências. |
| `starts_on` | `date` | Primeira ocorrência. |
| `ends_on` | `date` | Opcional. |
| `active` | `boolean` | Controla novas materializações. |
| `materialized_until` | `date` | Limite já gerado. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

Regras:

- Criação/edição exige entitlement Premium validado no servidor.
- Apenas Plantão, Procedimento e Atendimento usam esta tabela.
- A recorrência gratuita da bolsa de residência é gerada diretamente a partir de `residencies`.
- Ocorrências são materializadas em `work_entries` por 12 meses à frente.
- Uma rotina idempotente estende a janela mensalmente.
- `unique(series_id, occurrence_key)` impede duplicação.
- A interface de recorrência customizada não está definida nos designs. A opção não pode ser concluída até existir especificação de UX, embora o schema aceite `rrule`.
- Alterar uma série deve permitir, no futuro, distinguir ocorrência única de série. Como esse fluxo não está desenhado, edição de série fica bloqueada até definição; o MVP pode criar e desativar séries, mas não inventar política de alteração retroativa.

### `work_entries`

Uma ocorrência profissional.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `type` | enum | `shift`, `procedure` ou `appointment`. |
| `location_id` | `uuid` | FK obrigatória para local ativo no cadastro. |
| `description` | `text` | Procedimento/especialidade ou título opcional. |
| `work_date` | `date` | Obrigatório. |
| `start_time` | `time` | Obrigatório para `shift`; opcional nos demais tipos. |
| `duration_minutes` | `integer` | Obrigatório e positivo para `shift`; opcional nos demais. |
| `timezone` | `text` | IANA, obrigatório. |
| `series_id` | `uuid` | Opcional. |
| `occurrence_key` | `text` | Obrigatório quando pertence a série. |
| `source` | enum | `manual`, `import` ou `recurrence`. |
| `import_id` | `uuid` | Opcional; rastreia importação. |
| `deleted_at` | `timestamptz` | Exclusão lógica do agregado. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

Invariantes:

- `shift` exige `start_time` e `duration_minutes`.
- Procedimento e Atendimento exigem data, mas horário/duração podem ser nulos.
- `duration_minutes > 0` quando preenchido.
- Término é derivado de data + hora + duração; não armazenar campo duplicado.
- Um Trabalho excluído não aparece em Agenda, Home ou cálculos financeiros.
- Exclusão lógica também invalida seu Recebível para projeções, na mesma transação.

### `receivables`

Representa um valor a entrar ou já recebido.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `work_entry_id` | `uuid` | FK opcional e única. |
| `residency_id` | `uuid` | FK opcional. |
| `competence_month` | `date` | Primeiro dia do mês de competência. |
| `amount_cents` | `bigint` | Obrigatório, maior que zero. |
| `currency` | `char(3)` | `BRL` no MVP. |
| `expected_on` | `date` | Opcional; nulo significa sem previsão. |
| `received_at` | `timestamptz` | Opcional; confirmação explícita. |
| `invalidated_at` | `timestamptz` | Exclui o item das projeções sem apagar auditoria. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

Restrições:

- Exatamente uma origem deve existir: `work_entry_id` XOR `residency_id`.
- Um Trabalho possui exatamente um Recebível no MVP.
- Uma Residência possui no máximo um Recebível por `competence_month`.
- `received_at` só é definido por ação explícita da pessoa ou importação confirmada com esse dado presente.
- A importação nunca presume `received_at` quando o arquivo não contém status.

Status derivado, considerando a data local do usuário:

| Condição | Status |
| --- | --- |
| `invalidated_at is not null` | `invalidated` |
| `received_at is not null` | `received` |
| `expected_on is null` | `undated` |
| `expected_on < today` | `confirmation_pending` |
| `expected_on = today` | `due_today` |
| `expected_on > today` | `scheduled` |

### `residencies`

No máximo uma residência ativa por usuário.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `specialty` | `text` | Obrigatório. |
| `institution` | `text` | Opcional no onboarding; exibido quando disponível. |
| `level_label` | `text` | Ex.: R2; opcional. |
| `starts_on` | `date` | Obrigatório no cadastro completo. |
| `expected_ends_on` | `date` | Opcional. |
| `monthly_amount_cents` | `bigint` | Obrigatório, maior que zero. |
| `payment_day` | `smallint` | 1–31. |
| `active` | `boolean` | Apenas uma ativa por usuário. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

Geração mensal:

- É automática e disponível no plano Free.
- Não cria `work_series` e não consulta entitlement Premium.
- Criar Recebíveis do mês inicial até o término previsto.
- Sem término, materializar 12 meses à frente e estender mensalmente.
- Para meses sem o dia configurado, usar o último dia válido do mês.
- Atualizar valor ou dia reconcilia somente Recebíveis futuros e ainda não recebidos.
- Recebíveis já confirmados nunca são alterados retroativamente.

### `subscription_entitlements`

Espelho operacional do RevenueCat; RevenueCat continua sendo a autoridade de compra.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `user_id` | `uuid` | PK/FK. |
| `entitlement` | `text` | `premium`. |
| `is_active` | `boolean` | Gate do servidor. |
| `product_id` | `text` | Produto mensal/anual. |
| `store` | enum | `app_store` ou `play_store`. |
| `expires_at` | `timestamptz` | Opcional conforme compra. |
| `environment` | enum | `sandbox` ou `production`. |
| `last_event_id` | `text` | Idempotência do webhook. |
| `updated_at` | `timestamptz` | Auditoria. |

O cliente nunca concede Premium por conta própria. O gate visual usa o SDK RevenueCat; qualquer escrita Premium é revalidada no servidor.

### `notification_preferences`

Uma linha por usuário com quatro booleanos:

- `receivable_due_day`;
- `undated_weekly_reminder`;
- `upcoming_work_reminder`;
- `important_work_changes`.

Também contém `updated_at`. A permissão do sistema é um estado do device e não deve ser confundida com a preferência do usuário.

### `device_push_tokens`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `expo_push_token` | `text` | Único por instalação. |
| `platform` | enum | `ios` ou `android`. |
| `device_id_hash` | `text` | Identificador não reversível. |
| `last_seen_at` | `timestamptz` | Limpeza de tokens obsoletos. |
| `revoked_at` | `timestamptz` | Token inválido/desconectado. |

### `imports`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `user_id` | `uuid` | Dono. |
| `source` | enum | `plantaozinho`, `csv` ou `compatible_file`. |
| `storage_path` | `text` | Arquivo privado. |
| `original_filename` | `text` | Contexto para UI. |
| `status` | enum | `uploaded`, `parsing`, `ready`, `confirmed`, `failed`, `empty`, `cancelled`. |
| `row_count` | `integer` | Linhas lidas. |
| `valid_count` | `integer` | Registros importáveis. |
| `issue_count` | `integer` | Pendências. |
| `summary` | `jsonb` | Resumo sanitizado para preview; não é fonte dos Trabalhos. |
| `confirmed_at` | `timestamptz` | Quando a escrita foi autorizada. |
| `created_at` / `updated_at` | `timestamptz` | Auditoria. |

### `import_issues`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `import_id` | `uuid` | FK. |
| `user_id` | `uuid` | Dono, para RLS direta. |
| `row_number` | `integer` | Linha de origem. |
| `issue_code` | `text` | Ex.: `missing_amount`, `missing_location`. |
| `payload` | `jsonb` | Apenas dados necessários para correção. |
| `resolved_at` | `timestamptz` | Nulo enquanto pendente. |
| `created_work_entry_id` | `uuid` | Preenchido após resolução. |

Importação possui duas etapas: análise sem escrita de domínio e confirmação atômica. Registros válidos são criados somente depois de `Importar para a DOKH`. Pendências podem ser resolvidas depois sem bloquear os válidos.

## Projeções e cálculos

### Agenda

Fonte: `work_entries` não excluídos.

- Filtrar por `work_date` no mês/dia local.
- Ordenar por `start_time nulls last`, depois `created_at`.
- Cor vem do Local.
- Status financeiro vem do Recebível associado, mas não altera a ocorrência.
- Residência não entra no calendário.

### Próximo trabalho

Primeiro Trabalho não excluído cuja data/hora ainda não terminou. Para itens sem horário, considerar o início do dia local. Critérios de desempate: data, hora, criação.

### Previsto para entrar no mês

Soma de `receivables.amount_cents` onde:

- `expected_on` cai no mês selecionado;
- `invalidated_at is null`.

Itens sem data ficam fora. Recebidos e não recebidos participam do total previsto do mês.

### Recebido

Soma de Recebíveis com `received_at` no mês selecionado. Para o objeto `Recebido × A receber` de um mês previsto, usar os itens previstos naquele mês que já foram confirmados. A query deve manter as duas métricas nomeadas para não confundir os conceitos.

### A receber

Soma dos Recebíveis previstos no mês, sem `received_at`.

### Trabalho gerado

Soma dos Recebíveis ligados a Trabalhos cuja `work_date` cai no mês selecionado, independentemente de `expected_on`.

Residência não compõe `Trabalho gerado`; aparece apenas como origem de entrada.

### Valor/hora

Numerador: valor dos Recebíveis ligados a Trabalhos do período com duração registrada.

Denominador: soma de `duration_minutes` desses mesmos Trabalhos, convertida em horas.

- Excluir residência.
- Excluir trabalhos sem duração tanto do numerador quanto do denominador.
- Não exibir resultado quando denominador for zero.
- Arredondar apenas na apresentação; cálculo usa precisão decimal.

### Origem das entradas

Agrupar Recebíveis por:

- Plantões;
- Procedimentos;
- Atendimentos;
- Residência.

Percentual = valor da origem ÷ total considerado. Corrigir diferença de arredondamento visual no último segmento para totalizar 100%, sem alterar valores monetários.

### Primeiro mês e histórico insuficiente

- Uma competência com dados não produz média histórica nem tendência.
- Não fabricar `0%`.
- Insights exigem pelo menos dois períodos comparáveis; a mensagem de tendência desenhada usa três meses.

### Projeção anual Premium

- Realizado: meses já encerrados e mês atual conforme recebidos/previstos.
- Média: somente meses com histórico válido.
- Projeção: média mensal × meses futuros restantes.
- Identificar visualmente valor observado e estimado.
- Não calcular se a base mínima não existir; o design do estado insuficiente ainda precisa ser definido.

## Operações atômicas

As seguintes operações devem existir como RPC/Edge Function tipada:

- `create_work_with_receivable`;
- `update_work_with_receivable`;
- `delete_work_with_receivable`;
- `confirm_receivable_received`;
- `create_or_update_residency`;
- `generate_residency_receivables`;
- `create_work_series`;
- `materialize_work_series`;
- `analyze_import`;
- `confirm_import`;
- `resolve_import_issue`;
- `delete_account_and_data`.

Todas devem:

- obter `user_id` do JWT, nunca do payload confiável;
- validar ownership;
- ser idempotentes quando chamadas novamente;
- falhar por inteiro, sem estado parcial;
- retornar dados suficientes para invalidar/atualizar o cache do cliente.

## RLS e Storage

- `select/insert/update/delete` somente quando `auth.uid() = user_id`.
- Views devem usar `security_invoker` ou aplicar o filtro do usuário explicitamente.
- Buckets de avatar e importação são privados.
- Caminho de Storage começa com o UUID do usuário.
- URLs de download são assinadas e temporárias.
- Service role existe apenas em Edge Functions, nunca no app.
- Exclusão de conta remove Auth, linhas, tokens e objetos de Storage.

## Exclusão e arquivamento

- Trabalho: exclusão lógica do agregado; some de todas as projeções.
- Local: arquivamento; preserva referências históricas.
- Residência: desativação; Recebíveis futuros não recebidos são invalidados, recebidos permanecem no histórico.
- Conta: exclusão definitiva de todos os dados e arquivos do usuário.

As telas de confirmação e a janela de recuperação não estão definidas nos designs; não inventar microcopy ou prazo sem decisão de produto.

## Limites do MVP

Fora de escopo até nova decisão:

- Open Finance ou agregação bancária;
- múltiplas moedas;
- pagamentos parciais;
- impostos, custos, estornos e inadimplência contábil;
- compartilhamento de conta ou equipe;
- edição retroativa complexa de séries;
- sincronização bidirecional com calendário externo;
- Realtime entre devices simultaneamente abertos;
- modo offline com fila de escrita.
