# Agenda — tarefas 8.1 a 8.6

Agenda 01–05 e 15 de `design/agenda.html`; regras de `docs/screens/agenda.md`.

## Mês (8.1) — `src/features/agenda/AgendaScreen.tsx`

- Topo escuro como no design (`SUA AGENDA`, mês/ano com setas e `+`) e corpo creme num único scroll (`TwoToneScrollScreen`). Puxar a tela para baixo mantém o topo escuro (faixa escura acima do conteúdo, no próprio `TwoToneScrollScreen` — vale também para Início e Finanças).
- **Calendário em card** (`src/components/CalendarCard.tsx`), a pedido do usuário (2026-09-25, referência visual externa aplicada só ao calendário, com cores DOKH): card claro sobre a divisa do topo escuro com o corpo (o mês e as setas ficam no topo, fora do card; o componente tem cabeçalho opcional para outros usos); dias da semana em três letras com sábado e domingo em bronze; dias em quadrados arredondados — hoje com contorno bronze, seleção verde-escura, passados em cinza-verde — e **um ponto por Trabalho na cor do Local** (até 3). A grade tem só as semanas do mês: dias vizinhos (esmaecidos) completam a primeira e a última semana, nunca uma semana inteira de outro mês; tocar num deles leva ao mês dele. A semana começa na segunda, como na referência aprovada. Início de semana configurável ficou fora do escopo por decisão do usuário (2026-09-26).
- **Sempre abre no mês atual**, em hoje, ao entrar na aba; voltar do detalhe ou do `+` preserva o dia que se olhava. Em outro mês, a seleção vai para o dia 1.
- Dados: `listAgendaMonth` lê `agenda_work_projection` (view `security_invoker`, RLS do dono) do dia 1 ao último do mês, em ordem de dia, horário (sem horário por último) e criação. Chave `agenda/<user>/<mês>`, invalidada por qualquer escrita de Trabalho.

## Dia (8.2)

- Rótulo `HOJE · 25 SET` ou `12 SET · SEX` e contagem (`Dia livre`, `1 trabalho`, `N trabalhos`).
- Cards `WorkCard` (variante `agenda`) em ordem de horário: horário (Plantão mostra o início; Procedimento/Atendimento com duração mostram o intervalo; sem horário, nada), tipo com duração ou descrição, local, valor e estado do Recebível.
- Estados do Recebível: `Recebe 12 OUT`, `Recebe hoje`, `Previsto 12 OUT · a confirmar` (passado sem confirmação é pendência, nunca recebido automático), `Recebido` e `Sem previsão`.
- **A Agenda não soma valores** — consolidação é de Finanças.
- Dia sem Trabalho: `EmptyState agendaDay` com `Adicionar trabalho`, o mesmo fluxo do `+`. Falha de leitura mostra `LoadError` com nova tentativa, nunca "dia livre".
- Tocar num card abre o detalhe.

## Detalhe e exclusão (parte da 6.7/8.4) — `WorkDetailScreen.tsx`, rota `/work/[id]`

- Topo escuro com etiqueta do tipo (`PLANTÃO`, com o ponto na cor do Local), data por extenso e local (até duas linhas).
- Horário em **blocos** lado a lado — `INÍCIO`, `TÉRMINO` (com `+1 dia · 29 SET` quando cruza a meia-noite) e `DURAÇÃO` — que reduzem a fonte em vez de estourar a tela (pedido do usuário após o caso UBS Xpto de 28/09). Sem horário, os blocos de início e término não existem; sem duração, o de duração também não.
- Card com valor, previsão e status (ponto + texto, sem badge).
- **Excluir** abre uma folha de confirmação (P05 resolvida para Trabalho pelo usuário em 2026-09-25): "O trabalho em {local} no dia {data} sai da sua Agenda e o valor de {valor} deixa de aparecer em Finanças. Essa ação não pode ser desfeita." — `Excluir trabalho` (terracota) e `Cancelar`. A exclusão usa a RPC atômica (`delete_work_with_receivable`) com chave de idempotência por tentativa e invalida Agenda, Início e Finanças; ao concluir, volta para a Agenda. O teste real (`scripts/test-location-rpcs-6.1.mjs`) confirma que o Trabalho some da Agenda e de `finance_month_projection`.

## Edição (6.7/8.4) — `EditWorkScreen.tsx`, rota `/work/edit/[id]`

- `Editar trabalho` no detalhe abre o **mesmo formulário da criação** (`WorkForm` com `workId`), preenchido com tudo o que está gravado (`editDraftFromWork`): tipo, local, data, horário, duração, valor e previsão — um prazo D30/60/90 aparece como tal, e mudar a data o recalcula.
- Título `Editar trabalho` e botão `Salvar alterações`. A gravação usa a RPC atômica `update_work_with_receivable` com chave de idempotência por tentativa; a descrição existente é preservada. Trocar o local por um nome novo cria o Local (RPC da 6.1).
- Rascunho próprio (`useEditWorkDraft`), preenchido uma vez quando o Trabalho chega; ao salvar volta para o detalhe, que já reflete a alteração (Agenda, Início e Finanças são invalidados juntos).
- O teste real confirma a edição pela mesma RPC e que outra conta não edita.

**Ainda não entra**: o menu `···`. A edição é sempre de uma ocorrência; `Repetir` não aparece nela (a série se gerencia no detalhe).

## Dia livre

O botão `Adicionar trabalho` do dia livre ficou preenchido (escuro, 48 de altura) e com espaçamento de letras neutro — o do título grudava as palavras (pedido do usuário, 2026-09-25).

## Recorrência Premium (3.10/8.5)

- **Servidor** (`supabase/migrations/20260926000000_work_recurrence.sql`, testes em `supabase/tests/3_10_work_recurrence.sql` e no real `scripts/test-location-rpcs-6.1.mjs`):
  - `work_series` guarda o modelo do Trabalho (tipo, Local, horário, duração, valor e dias até o pagamento — `null` = "Ainda não sei").
  - `create_work_series` exige Premium **antes de qualquer escrita** (Free recebe 42501 sem estado parcial), aceita `weekly`, `biweekly` e `monthly` (o `custom` espera a P03), é idempotente por chave e materializa Trabalho + Recebível até 12 meses à frente, sem duplicar (`series_id + occurrence_key`). As datas saem sempre da primeira: o mensal no dia 31 cai em 28/29/30 nos meses curtos, sem escorregar.
  - Job diário `dokh-work-series-extension` (03:30) estende o horizonte das séries ativas enquanto o dono tiver Premium; quem perde o Premium mantém o que já foi gerado. Local arquivado para a geração.
  - Cada ocorrência é editada ou excluída sozinha pelas RPCs de Trabalho (agora aceitam `source = recurrence`); a chave da ocorrência fica, então o job nunca recria uma data editada ou excluída.
  - `stop_work_series` (“Parar de repetir”) mantém hoje e o passado, e remove da Agenda e de Finanças as próximas ainda não recebidas. Não exige Premium.
  - `agenda_work_projection` ganhou `series_id`, `series_frequency` e `series_active`.
- **App**:
  - Formulário (Agenda 07): abaixo do divisor, as linhas `Repetir` e `Cor do local` (componente `OptionRow`). No Free, mostram o selo `PREMIUM`; no Premium, só o `›`, sem cadeado nem selo. `Repetir` só aparece na criação.
  - Folha 11 (Premium): `Não repetir`, `Toda semana`, `A cada 2 semanas` e `Todo mês`, com as próximas três datas da opção escolhida e o aviso de que cada data pode ser editada sozinha.
  - Folha 12 (Free): `PremiumGate` com a prévia real esmaecida, que mostra o dia da semana, o dia do mês e a data +14 calculados da data escolhida, e a saída `Continuar sem recorrência`.
  - Salvar com frequência chama `create_work_series` com a mesma chave de idempotência.
  - Detalhe (Agenda 15): card `Este trabalho se repete · Toda semana · próximo em 21 SET`. Quem tem Premium vê `Gerenciar →`, que abre a confirmação de `Parar de repetir`.

## Cor do local (8.6)

- Paleta ampliada com oito cores do HTML: Sage, Bronze, Azul, Verde, Terra, Violeta, Cáqui e Petróleo. Cáqui (`#9A8F6A`) e Petróleo (`#5E7A72`) são tokens novos (`workKhaki`, `workPetrol`).
- Folha 13 (Premium):
  - grade 4×2 com o nome embaixo de cada cor;
  - prévia do dia no calendário (número e ponto) e do card (barra e nome), com a frase `Assim aparece na sua agenda`;
  - botão `Salvar cor`.
- A cor vale para o **Local**, não só para o Trabalho:
  - ao salvar o Trabalho, um Local novo nasce com a cor escolhida;
  - um Local existente é atualizado por `update_work_location`, com `premium_palette` (ou `free_palette` para as quatro cores livres);
  - o servidor revalida o Premium.
- Folha 14 (Free):
  - `PremiumGate` com os Locais da pessoa, cada um na sua cor e com a paleta esmaecida ao lado;
  - saída `Usar cor automática`.
- O ponto do campo `LOCAL` mostra a cor escolhida.

## Premium sem o fluxo de benefícios

Enquanto a 5.5 (benefícios/paywall) não existe, as folhas Free não mostram `Conhecer DOKH Premium`:
- `PremiumGate` aceita `onLearnMore` opcional;
- sem ele, a saída sem custo vira o botão principal escuro.

Quando a 5.5 entrar, basta passar `onLearnMore` nas duas folhas (`src/features/work/form/PremiumSheets.tsx`).

