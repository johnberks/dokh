# Finanças — tarefas 9.1, 9.2, 9.4, 9.5 e parte da 9.6

Finanças 01, 01-B/C/D/E, 03-B, 11, 12 e 13 de `design/financas.html`; regras de `docs/screens/financas.md`. Ajustes pedidos pelo usuário em 2026-09-26 marcados com ★.

## Estrutura

- ★ **Uma única rolagem**: topo verde e corpo bege sobem juntos (`TwoToneScrollScreen`, com o topo escuro também ao puxar para baixo).
- ★ **Troca de período igual à Agenda**: `PeriodSwitcher` (`src/components`), o mesmo componente da Agenda, em tamanho compacto na primeira linha do topo, ao lado do seletor `Mês`/`Ano` — `‹ Setembro 2026 ›` no mês e `‹ 2026 ›` no ano (sem rótulo acima, segundo ajuste de 2026-09-26). A aba sempre abre no mês atual, exceto ao voltar do `+` ou da edição.
- ★ **Layout do HTML, com passagem reta** e espaço menor entre o fim do verde e o começo do bege: nada sobrepõe o topo verde; as seções ficam no bege, e a passagem do verde para o bege é reta (sem os cantos arredondados do HTML). O gráfico anual usa `BarChartCard` com `surface="plain"`, direto no fundo, como em Finanças 03.

## Mês — `FinancesScreen.tsx`

| Seção | Quando aparece |
| --- | --- |
| Topo | Previsto no mês atual; no futuro, "previstos para entrar em outubro"; no passado, o que **entrou** ("· mês fechado" sem pendência); `R$ —` sem previsão ("nada registrado ainda" ou "nada previsto para entrar ainda"). |
| Recebido × A receber | ★ Componente `ReceiptProgressCard` (`src/components`): os dois blocos e a barra num bloco só. Só com entrada prevista. Percentual arredondado para baixo (nunca 100% antes da hora); `nada em aberto`/`mês fechado` quando tudo entrou. Tocar em cada lado abre a folha correspondente. |
| Próxima entrada | Mês atual/futuro com entrada em aberto: dia, `hoje`/`amanhã`/`em N dias`, origem (Local ou Residência) e valor. Sem ela, o estado `Nenhuma prevista` com o motivo (tudo recebido, mês fechado, aguardando confirmação, só sem data). |
| ★ Revisão necessária | **Só no mês atual e só quando há valores sem data** (a pendência é de agora, não de cada mês). `ReviewCard` detalhado com até dois previews e `+ N`, sem texto de apoio; `Adicionar datas` (espaçamento corrigido) abre a edição do primeiro Trabalho sem data. |
| Origem das entradas | Só com entrada prevista. Premium: valores reais e percentuais. Free: estrutura oculta (`••••`) e selo Premium. |
| Seu trabalho em {mês} | Só com Trabalho no mês (competência): gerado, quantidade, horas e valor/hora. ★ Valor/hora em reais inteiros (`R$ 109/h`, como no HTML) e numa linha só — os centavos quebravam a linha. Free vê gerado, quantidade e horas (Finanças 12/13) e o valor/hora oculto com selo. |
| ★ Insight de valor/hora | Último item de Finanças 01 (`InsightCard`): o mês contra a média dos até dois meses anteriores com valor/hora — conclusão (aumentando/caiu/estável), barras, variação (`↑ 14%`), frase com números reais e "Menos trabalhos, valor maior." quando vale. Sem o mês ou sem mês anterior, não aparece. Free vê a conclusão (direção por gerado ÷ horas) com números ocultos e selo. `Ver análise completa` chega com a análise (Finanças 02). |
| Sem nada no mês | `EmptyState financesNoWork` com `Adicionar trabalho`. Erro de leitura é `LoadError`, nunca mês vazio. |

## Folhas explicativas (9.4) — `FinanceInfo.tsx`

★ Os `i` do HTML abrem folhas no formato das Sheets 15–18/22: rótulo, número (recebido em verde), explicação, exemplo com ponto bronze e o botão `Entendi` (o HTML usa "Entendi"; os textos também são os do HTML): previsto para entrar, recebido e a receber (tocando nos blocos), trabalho gerado, valor/hora, total do ano, média mensal, valor/hora no ano e projeção. No valor/hora, o exemplo usa os números reais do mês (Premium); no Free o valor aparece oculto.

## Ano

- ★ **Gráfico em bloco** (`BarChartCard`, `src/components`, superfície de card como o `CalendarCard`): título `GANHOS DE 2026` em Plex Mono semibold (o peso mais forte carregado) e espaçado, legenda `mês atual`, barras em sálvia cheio relativas ao maior mês, mês atual em bronze e mês sem dado **tracejado** (nunca zero). A média mensal é o rodapé do próprio bloco. ★ O bloco sobe sobre o topo verde (o verde fica por trás), como o calendário da Agenda.
- ★ **Valor/hora médio no ano e evolução** (Premium), em duas caixinhas lado a lado com cor de destaque (bronze e verde), valores centralizados e texto fixo + `i` sempre numa linha (o texto encolhe antes de quebrar): valor/hora de todos os trabalhos do ano com duração, ponderado pelas horas de cada mês (não média de médias), e variação entre o primeiro e o último mês com valor/hora — sem dois meses, nada de tendência. Free vê `R$ •••/h` e `+••%` com selo.
- ★ **Projeção para o ano** (Premium, só no ano corrente e com média): previsto até o mês atual + média × meses restantes. `ProjectionChart` (`src/components`) é **acumulado** (pedido do usuário: a versão mês a mês parecia cair a zero depois do mês atual) — linha verde com o total do ano até agora e tracejado bronze somando a média a cada mês até o total de dezembro; legenda e a frase "Mantendo sua média de R$ X/mês, outubro a dezembro somam mais R$ Y." Free vê o valor oculto, selo e a explicação.
- Topo: total `recebidos e previstos em 2026`.
- Rodapé: média mensal só com base suficiente (`historical_average_cents`, ≥ 2 meses); sem ela, "Seu histórico começa agora." (Finanças 13).
- Origem das entradas no ano: Premium soma as origens dos meses com entrada (o servidor devolve `null` no Free).

## Premium

- ★ `usePremium` lê o espelho do servidor (`subscription_entitlements`), a mesma regra das projeções. **Quem tem Premium não vê selo nem cadeado** — os números simplesmente aparecem.
- ★ Para testes, a conta local `jlucasberlinck@hotmail.com` recebeu um entitlement `sandbox` manual (`dev-manual-2026-09-26`), só no Supabase local.
- O servidor já nega números interpretativos ao Free (valor/hora e origem `null`); a UI só escolhe como mostrar.

## Ainda não entram (itens temporários só quando fazem sentido ★)

- `Ver entradas`/`Ver extrato do mês` e toque nos blocos: chegam com o extrato (9.3).
- `Desbloquear com Premium`: chega com o fluxo de benefícios (5.5); até lá o Free vê a estrutura e o selo, sem botão que não leva a lugar nenhum.
- Análise completa de valor/hora (Finanças 02) e o atalho `Ver análise completa` (resto da 9.6).

## Dados — `finance-data.ts`

`finance_month_projection`, `finance_month_origins`, `finance_year_projection` (RPCs da 3.11), `receivable_projection` (próxima entrada) e `agenda_work_projection` (previews sem data). Chaves com prefixo `finance-month`/`finance-year`, invalidadas por toda escrita de Trabalho. O teste real (`scripts/test-location-rpcs-6.1.mjs`) roda as mesmas consultas do app — mês, ano, origens nulas no Free, próxima entrada, entitlement e previews.
