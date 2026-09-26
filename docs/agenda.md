# Agenda — tarefas 8.1 e 8.2 (+ detalhe em leitura)

Agenda 01–05 e 15 de `design/agenda.html`; regras de `docs/screens/agenda.md`.

## Mês (8.1) — `src/features/agenda/AgendaScreen.tsx`

- Topo escuro como no design (`SUA AGENDA`, mês/ano com setas e `+`) e corpo creme num único scroll (`TwoToneScrollScreen`). Puxar a tela para baixo mantém o topo escuro (faixa escura acima do conteúdo, no próprio `TwoToneScrollScreen` — vale também para Início e Finanças).
- **Calendário em card** (`src/components/CalendarCard.tsx`), a pedido do usuário (2026-09-25, referência visual externa aplicada só ao calendário, com cores DOKH): card claro sobre a divisa do topo escuro com o corpo (o mês e as setas ficam no topo, fora do card; o componente tem cabeçalho opcional para outros usos); dias da semana em três letras com sábado e domingo em bronze; dias em quadrados arredondados — hoje com contorno bronze, seleção verde-escura, passados em cinza-verde — e **um ponto por Trabalho na cor do Local** (até 3). A grade tem só as semanas do mês: dias vizinhos (esmaecidos) completam a primeira e a última semana, nunca uma semana inteira de outro mês; tocar num deles leva ao mês dele. A semana começa na segunda, como na referência aprovada.
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

**Ainda não entram**: o menu `···` e o bloco de recorrência (8.5).

## Dia livre

O botão `Adicionar trabalho` do dia livre ficou preenchido (escuro, 48 de altura) e com espaçamento de letras neutro — o do título grudava as palavras (pedido do usuário, 2026-09-25).
