# Agenda — tarefas 8.1 e 8.2 (+ detalhe em leitura)

Agenda 01–05 e 15 de `design/agenda.html`; regras de `docs/screens/agenda.md`.

## Mês (8.1) — `src/features/agenda/AgendaScreen.tsx`

- Topo escuro (`SUA AGENDA`, mês/ano com navegação e `+`) sobre o corpo creme, num único scroll (`TwoToneScrollScreen`).
- `CalendarGrid` com hoje em contorno bronze, dia selecionado em verde, dias passados em cinza-verde e **um ponto por Trabalho na cor do Local** (até 3 por célula). O calendário começa no domingo, como no design; início de semana configurável depende das preferências (Perfil).
- Seleção inicial: hoje no mês atual; em outro mês, o dia 1; voltar ao mês atual volta a hoje.
- Dados: `listAgendaMonth` lê `agenda_work_projection` (view `security_invoker`, RLS do dono) do dia 1 ao último do mês, em ordem de dia, horário (sem horário por último) e criação. Chave `agenda/<user>/<mês>`, invalidada por qualquer escrita de Trabalho.

## Dia (8.2)

- Rótulo `HOJE · 25 SET` ou `12 SET · SEX` e contagem (`Dia livre`, `1 trabalho`, `N trabalhos`).
- Cards `WorkCard` (variante `agenda`) em ordem de horário: horário (Plantão mostra o início; Procedimento/Atendimento com duração mostram o intervalo; sem horário, nada), tipo com duração ou descrição, local, valor e estado do Recebível.
- Estados do Recebível: `Recebe 12 OUT`, `Recebe hoje`, `Previsto 12 OUT · a confirmar` (passado sem confirmação é pendência, nunca recebido automático), `Recebido` e `Sem previsão`.
- **A Agenda não soma valores** — consolidação é de Finanças.
- Dia sem Trabalho: `EmptyState agendaDay` com `Adicionar trabalho`, o mesmo fluxo do `+`. Falha de leitura mostra `LoadError` com nova tentativa, nunca "dia livre".
- Tocar num card abre o detalhe.

## Detalhe em leitura (parte da 6.7/8.4) — `WorkDetailScreen.tsx`, rota `/work/[id]`

Data por extenso, local, início → término (com "do dia seguinte" quando cruza a meia-noite), tipo e duração, valor, previsão e status (ponto + texto, sem badge). Sem horário, a linha de horário não existe; sem previsão, `Sem previsão`.

**Ainda não entram**: `Editar trabalho` e `Excluir` (próxima PR, 6.7/8.4 — a confirmação de exclusão depende de P05), o menu `···` e o bloco de recorrência (8.5).
