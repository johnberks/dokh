# Finanças — tarefas 9.1, 9.2 e 9.5 (+ origem Premium)

Finanças 01, 01-B/C/D/E, 03-B, 11, 12 e 13 de `design/financas.html`; regras de `docs/screens/financas.md`. Ajustes pedidos pelo usuário em 2026-09-26 marcados com ★.

## Estrutura

- ★ **Uma única rolagem**: topo verde e corpo bege sobem juntos (`TwoToneScrollScreen`, com o topo escuro também ao puxar para baixo).
- ★ **Troca de período igual à Agenda**: `PeriodSwitcher` (`src/components`), o mesmo componente da Agenda — `‹ Setembro 2026 ›` no mês e `‹ 2026 ›` no ano. Acima dele, `SUAS FINANÇAS` e o seletor `Mês`/`Ano` (como `SUA AGENDA` na Agenda). A aba sempre abre no mês atual, exceto ao voltar do `+` ou da edição.
- ★ **Efeito do calendário**: os blocos `Recebido × A receber` (mês) e o gráfico anual (ano) sobem sobre o topo verde, que termina no meio deles. Sobre o verde o bloco precisa ser opaco: o verde translúcido do HTML virou o tom sólido equivalente.

## Mês — `FinancesScreen.tsx`

| Seção | Quando aparece |
| --- | --- |
| Topo | Previsto no mês atual; no futuro, "previstos para entrar em outubro"; no passado, o que **entrou** ("· mês fechado" sem pendência); `R$ —` sem previsão ("nada registrado ainda" ou "nada previsto para entrar ainda"). |
| Recebido × A receber | Só com entrada prevista. Percentual arredondado para baixo (nunca 100% antes da hora); `nada em aberto`/`mês fechado` quando tudo entrou. |
| Próxima entrada | Mês atual/futuro com entrada em aberto: dia, `hoje`/`amanhã`/`em N dias`, origem (Local ou Residência) e valor. Sem ela, o estado `Nenhuma prevista` com o motivo (tudo recebido, mês fechado, aguardando confirmação, só sem data). |
| ★ Revisão necessária | **Só no mês atual e só quando há valores sem data** (a pendência é de agora, não de cada mês). `ReviewCard` detalhado com até dois previews e `+ N`; `Adicionar datas` abre a edição do primeiro Trabalho sem data. |
| Origem das entradas | Só com entrada prevista. Premium: valores reais e percentuais. Free: estrutura oculta (`••••`) e selo Premium. |
| Seu trabalho em {mês} | Só com Trabalho no mês (competência): gerado, quantidade, horas e valor/hora. Free vê gerado, quantidade e horas (Finanças 12/13) e o valor/hora oculto com selo. |
| Sem nada no mês | `EmptyState financesNoWork` com `Adicionar trabalho`. Erro de leitura é `LoadError`, nunca mês vazio. |

## Ano

- ★ **Gráfico em componente** (`BarChartCard`, `src/components`), com a superfície do `CalendarCard`: `JANEIRO → DEZEMBRO`, legenda `mês atual`, barras relativas ao maior mês, mês atual em bronze e mês sem dado **tracejado** (nunca zero).
- Topo: total `recebidos e previstos em 2026`.
- Rodapé: média mensal só com base suficiente (`historical_average_cents`, ≥ 2 meses); sem ela, "Seu histórico começa agora." (Finanças 13).
- Origem das entradas no ano: Premium soma as origens dos meses com entrada (o servidor devolve `null` no Free).

## Premium

- ★ `usePremium` lê o espelho do servidor (`subscription_entitlements`), a mesma regra das projeções. **Quem tem Premium não vê selo nem cadeado** — os números simplesmente aparecem.
- O servidor já nega números interpretativos ao Free (valor/hora e origem `null`); a UI só escolhe como mostrar.

## Ainda não entram (itens temporários só quando fazem sentido ★)

- `Ver entradas`/`Ver extrato do mês` e toque nos blocos: chegam com o extrato (9.3).
- `Desbloquear com Premium`: chega com o fluxo de benefícios (5.5); até lá o Free vê a estrutura e o selo, sem botão que não leva a lugar nenhum.
- Ícones `i` e folhas explicativas (9.4).
- Insight, valor/hora e evolução no ano, projeção até dezembro e análise completa (9.6).

## Dados — `finance-data.ts`

`finance_month_projection`, `finance_month_origins`, `finance_year_projection` (RPCs da 3.11), `receivable_projection` (próxima entrada) e `agenda_work_projection` (previews sem data). Chaves com prefixo `finance-month`/`finance-year`, invalidadas por toda escrita de Trabalho. O teste real (`scripts/test-location-rpcs-6.1.mjs`) roda as mesmas consultas do app — mês, ano, origens nulas no Free, próxima entrada, entitlement e previews.
