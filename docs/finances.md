# Finanças — tarefas 9.1, 9.2, 9.4, 9.5 e parte da 9.6

Finanças 01, 01-B/C/D/E, 03-B, 11, 12 e 13 de `design/financas.html`; regras de `docs/screens/financas.md`. Ajustes pedidos pelo usuário em 2026-09-26 marcados com ★.

## Estrutura

- ★ **Uma única rolagem**: topo verde e corpo bege sobem juntos (`TwoToneScrollScreen`, com o topo escuro também ao puxar para baixo).
- ★ **Troca de período igual à Agenda**: `PeriodSwitcher` (`src/components`), o mesmo componente da Agenda, em tamanho compacto na primeira linha do topo, ao lado do seletor `Mês`/`Ano` — `‹ Setembro 2026 ›` no mês e `‹ 2026 ›` no ano (sem rótulo acima, segundo ajuste de 2026-09-26). A aba sempre abre no mês atual, exceto ao voltar do `+` ou da edição.
- ★ **Passagem reta do verde para o bege, com o bloco principal por cima do verde** (pedido do usuário, 2026-09-26, substitui o "nada sobreposto" anterior): no Mês, o card `ReceiptProgressCard`; no Ano, o `BarChartCard` em card. Ambos sobem 96 pt sobre o topo, como o calendário da Agenda. Sem entrada prevista (ou sem dados no ano), o topo volta ao tamanho normal.

## Mês — `FinancesScreen.tsx`

| Seção | Quando aparece |
| --- | --- |
| Topo | Previsto no mês atual; no futuro, "previstos para entrar em outubro"; no passado, o que **entrou** ("· mês fechado" sem pendência); `R$ —` sem previsão ("nada registrado ainda" ou "nada previsto para entrar ainda"). |
| Recebido × A receber | ★ Componente `ReceiptProgressCard` (`src/components`): **um card só** (superfície do `CalendarCard`) com as duas caixas em cima e a barra de 12 pt e a legenda embaixo; fica sobre o topo verde. Só com entrada prevista. Percentual arredondado para baixo (nunca 100% antes da hora); `nada em aberto`/`mês fechado` quando tudo entrou. Tocar em cada lado abre a folha correspondente. |
| Próxima entrada | Mês atual/futuro com entrada em aberto: dia, `hoje`/`amanhã`/`em N dias`, origem (Local ou Residência) e valor. Sem ela, o estado `Nenhuma prevista` com o motivo (tudo recebido, mês fechado, aguardando confirmação, só sem data). |
| ★ Revisão necessária | **Só no mês atual e só quando há valores sem data** (a pendência é de agora, não de cada mês). `ReviewCard` detalhado com até dois previews e `+ N`, sem texto de apoio; `Adicionar datas` (espaçamento corrigido) abre a edição do primeiro Trabalho sem data. |
| Origem das entradas | Só com entrada prevista. Premium: valores reais e percentuais. Free: estrutura oculta (`••••`) e selo Premium. |
| Seu trabalho em {mês} | Só com Trabalho no mês (competência): gerado, quantidade, horas e valor/hora. ★ Valor/hora em reais inteiros (`R$ 109/h`, como no HTML) e numa linha só — os centavos quebravam a linha. Free vê gerado, quantidade e horas (Finanças 12/13) e o valor/hora oculto com selo. |
| ★ Insight de valor/hora | Último item de Finanças 01 (`InsightCard`): o mês contra a média dos até dois meses anteriores com valor/hora — conclusão (aumentando/caiu/estável), barras, variação (`↑ 14%`), frase com números reais e "Menos trabalhos, valor maior." quando vale. Sem o mês ou sem mês anterior, não aparece. Free vê a conclusão (direção por gerado ÷ horas) com números ocultos e selo. `Ver análise completa` chega com a análise (Finanças 02). |
| Sem nada no mês | `EmptyState financesNoWork` com `Adicionar trabalho`. Erro de leitura é `LoadError`, nunca mês vazio. |

## Folhas explicativas (9.4) — `FinanceInfo.tsx`

★ Os `i` do HTML abrem folhas no formato das Sheets 15–18/22: rótulo, número (recebido em verde), explicação, exemplo com ponto bronze e o botão `Entendi` (o HTML usa "Entendi"; os textos também são os do HTML): previsto para entrar, recebido e a receber (tocando nos blocos), trabalho gerado, valor/hora, total do ano, média mensal, valor/hora no ano e projeção. No valor/hora, o exemplo usa os números reais do mês (Premium); no Free o valor aparece oculto.

## Ano (conceito do usuário, 2026-09-26; referências Mobbin)

Ordem: resumo → entradas mês a mês → origem → seu ano → valor/hora → projeção.

Títulos das seções ficam **dentro** dos cards (o teste com títulos fora foi revertido a pedido do usuário).

1. **Resumo anual** (topo verde): só o total `recebidos e previstos em 2026` — sem barra nem valores de recebido/a receber (retirados a pedido do usuário).
2. **Entradas mês a mês**: modelo anterior (pedido do usuário) — `BarChartCard` em card sobre o verde, valor em cima de cada barra (uma linha), com **três tipos de barra**: consolidado (sálvia cheio), mês atual (bronze) e futuro previsto (só contorno sálvia, valor esmaecido); sem dado, tracejado. Legenda Consolidado · Mês atual · Previsto abaixo das barras. O componente é o gráfico + o **ganho médio até o mês atual** no rodapé ("R$ 4.918 é sua média de ganho mensal", média dos meses concluídos, ≥ 2); sem base, "Seu histórico começa agora.".
3. **Origem**: valor e % por origem (Premium; Free com estrutura oculta e selo).
4. **Seu ano** (aberto no Free): média mensal, melhor mês já vivido (pelo previsto, até o atual), trabalhos e horas do ano (`readYearWork` soma os meses; agora pedido também no Free).
5. **Valor/hora médio do ano**: número em destaque (ponderado pelas horas), sem percentual de evolução (pedido do usuário) e, como apoio, "calculado com Xh de trabalhos com duração registrada". Free: `R$ •••/h` com selo; horas abertas.
6. **Projeção até dezembro** (Premium, ano corrente, com média): valor final em destaque e escrito no ponto de dezembro. Linha cheia = **só o recebido** acumulado até hoje (área verde suave); tracejado bronze soma o previsto até o mês atual ainda não confirmado e, em cada mês que falta, **o maior entre o já previsto e a média dos meses concluídos** — nunca abaixo do que já está marcado. Marca `HOJE` no mês atual; eixo JAN · atual · DEZ sob os pontos.

## Premium

- ★ `usePremium` lê o espelho do servidor (`subscription_entitlements`), a mesma regra das projeções. **Quem tem Premium não vê selo nem cadeado** — os números simplesmente aparecem.
- ★ Para testes, a conta local `jlucasberlinck@hotmail.com` recebeu um entitlement `sandbox` manual (`dev-manual-2026-09-26`), só no Supabase local.
- O servidor já nega números interpretativos ao Free (valor/hora e origem `null`); a UI só escolhe como mostrar.

## Próxima entrada — `NextEntryCard.tsx`

Retorno do usuário (2026-09-26), com referências da Mobbin (Kit, Gusto, Quicken/Copilot, Plum): o tempo que falta é a manchete (`Hoje`, `Amanhã`, `Em 3 dias`) com a data por extenso; valor em destaque e origem com o mesmo ícone de tipo de Entradas (`OriginTile`); etiqueta `Previsto` ou `Hoje` (bronze); no dia previsto, `Você recebeu?` confirma no próprio card (só pelo servidor, falha avisa); no mês atual, até duas entradas seguintes e `+N entradas até o fim do mês`; `Ver entradas ›` em linha inteira. `readNextEntry` lê até três com `count: 'exact'`.

## Entradas (9.3) — `EntriesScreen.tsx`, rota `/finances/entries?month=`

- Aberta por `Ver entradas` (card da próxima entrada, inteiro tocável) e `Ver extrato do mês` (sem próxima entrada, só quando o mês tem entradas). Voltar não reseta o mês de Finanças.
- Topo verde numa **barra só** (retorno do usuário, referências Up/Origin da Mobbin): voltar em círculo à esquerda e, no centro, `ENTRADAS` com o `PeriodSwitcher` compacto. A análise de valor/hora usa a mesma barra, com o título abaixo.
- Itens em card com seta `›` nos trabalhos e ícone do tipo (Residência sem seta, porque não abre nada). O resumo sobe sobre o verde: `ReceiptProgressCard` (recebidos × a receber + barra) no mês atual/passado; no futuro, previstos e quantidade de entradas. Legenda do passado com pendência: "N entrada(s) aguardando sua confirmação".
- Timeline com `ReceivableRow`, pela data prevista, no mesmo recorte do total de Finanças (`readMonthEntries`: sem invalidados, sem Trabalhos excluídos, sem "sem data"). Status do servidor (`receipt_status`).
- `Você recebeu?` chama `confirm_receivable_received` (3.8): sem otimismo, spinner no item, falha mantém pendente e avisa; sucesso invalida `finance-month`, `finance-year`, `agenda` e `home-overview`.
- Tocar num Trabalho abre o detalhe; Residência não tem destino (desabilitado).
- Mês vazio: `Nada previsto por enquanto.` sem `R$ 0`; erro de leitura nunca vira vazio.

## Análise completa de valor/hora (9.6, Finanças 02) — `HourlyAnalysisScreen.tsx`, rota `/finances/hourly?month=`

- 100% Premium: o link `Ver análise completa` só aparece no insight Premium; a rota redireciona o Free para Finanças. Sem selo (está liberada) e sem CTAs.
- Card do trabalho (`WorkGeneratedCard`, extraído para `FinanceCards.tsx`) sobre o verde; card escuro com `R$ 176 /h`, fórmula gerado ÷ horas numa linha e frase. "O maior valor dos últimos N meses" só com ≥ 3 meses e o mês escolhido estritamente maior.
- Evolução: seis meses até o escolhido (`readHourlyHistory`); só meses com valor/hora viram barra (sem zero inventado). Variação primeiro × último com ≥ 2 meses; "os dois melhores meses" só com ≥ 4.

## Ainda não entram (itens temporários só quando fazem sentido ★)

- `Desbloquear com Premium`: chega com o fluxo de benefícios (5.5); até lá o Free vê a estrutura e o selo, sem botão que não leva a lugar nenhum (inclusive `Ver análise completa`).

## Dados — `finance-data.ts`

`finance_month_projection`, `finance_month_origins`, `finance_year_projection` (RPCs da 3.11), `receivable_projection` (próxima entrada) e `agenda_work_projection` (previews sem data). Chaves com prefixo `finance-month`/`finance-year`, invalidadas por toda escrita de Trabalho. O teste real (`scripts/test-location-rpcs-6.1.mjs`) roda as mesmas consultas do app — mês, ano, origens nulas no Free, próxima entrada, entitlement, previews, Entradas e confirmação (outra conta não confirma; o resumo reflete).

## Títulos de card — `CardLabel` (`src/components`)

Pedido do usuário (2026-09-26): o rótulo técnico dos cards (Plex 10 pt, regular, sálvia) ficava apagado. Todos os títulos de card seguem o modelo do `GANHOS DE 2026`: Plex Mono **semibold**, 11 pt, espaçamento 1,65, cor escura (`tone`: `structure` no Recebido, `bronze` nos cards escuros de insight/análise, `attention` na revisão). Aplicado em `SectionCard`, gráfico anual, valor/hora do ano, próxima entrada, Recebido × A receber, Entradas (futuro), análise de valor/hora, insight, `WorkCard`, `ReviewCard`, `ProgressCard` e nos cards do `EmptyState` (próxima entrada, teaser de Finanças, Home). Rótulos de topo e de formulário não mudaram.
