# Onboarding v2: proposta narrativa (7.7)

> Status: **proposta para aprovação**. Nenhuma tela foi alterada. Depois de aprovada, ela substitui o fluxo de `docs/screens/onboarding.md` nos pontos indicados. A identidade visual (Archivo, verde-escuro, creme, bronze como acento, superfícies DOKH) é mantida.

Princípio: **Ask → Apply → Show value**. Cada pergunta precisa produzir uma consequência visível.

Narrativa: **fragmentação → entendimento → construção → organização → clareza**.

---

## 1. Referências do Mobbin e o que aprender de cada uma

| App · fluxo | Padrão | Como adaptar na DOKH |
| --- | --- | --- |
| [Duolingo · Onboarding](https://mobbin.com/flows/b0b4f93f-5637-46ec-9d77-49ecda6b991d) | Alterna pergunta e uma fala curta que **devolve a consequência** ("Since you know a few words, let's start at Score 10"). Telas-ponte sem formulário ("Let's set up a learning routine!"). | Depois de perguntas-chave, uma frase que mostre o que mudou ("Sua residência já entra todo dia 05"). A fala vem do próprio objeto DOKH, não de um mascote. |
| [Duolingo · Escolher meta](https://mobbin.com/flows/e8ee7348-2019-4b8f-8179-7f4961ef6ea8) | Cada opção traz um rótulo de significado ("Casual", "Serious"). | As opções de foco ganham uma linha do benefício ("Quero saber onde e quando vou trabalhar"). |
| [YNAB · Setting up](https://mobbin.com/flows/dd621846-2646-48f2-bf88-c5a0e6fc31a7) | Abre nomeando **o problema** antes de pedir qualquer dado; "What brings you to YNAB today?"; termina com um plano com o nome da pessoa ("Sam's Plan"). | Abertura narrativa de fragmentação + pergunta de foco. O payoff final é "Sua DOKH, João". |
| [Rocket Money · Onboarding](https://mobbin.com/flows/fed2772b-6edd-432f-b195-0691f2d84d04) | Pergunta de meta; depois uma tela que explica a ferramenta com um card de exemplo. **Antipadrões:** "How did you find us?" (pergunta só para marketing) e paywall logo após o onboarding. | Aproveitamos a pergunta de meta. Evitamos perguntas sem consequência e paywall antes do valor. |
| [Revolut · Onboarding](https://mobbin.com/flows/7291bae9-7b5a-4b40-a911-316447f4437c) | "What do you want to use Revolut for?" em chips agrupados para personalizar sugestões. | Confirma a pergunta de intenção. A DOKH usa escolha única: três focos claros são mais fáceis de transformar em consequência do que uma nuvem de chips. |
| [Copilot Money · Onboarding](https://mobbin.com/flows/bec90a3f-1c1b-490a-b27d-8445cc6e62a7) e [Demo mode](https://mobbin.com/flows/f49d08d4-5812-49de-84cc-34c9b30b5507) | "Your Finances: let's make sure these numbers are correct", uma revisão dos números montados antes de entrar; coach marks explicando cada valor. | O payoff mostra os números montados de forma reconhecível; o guia de primeiro uso (já existe) explica cada valor depois. |
| [Wispr Flow · estilo padrão](https://mobbin.com/screens/8e47433a-12db-43bd-a521-e71fa5311b00) | A opção selecionada **expande com uma prévia do resultado** dentro do próprio card. | No foco, a opção escolhida mostra a mini-sequência: Onde/Quando/Quanto, Trabalho → D30 → Entrada ou Plantões + Residência → Mês. |
| [Monzo · Choose your target](https://mobbin.com/screens/adc853fa-7f79-453e-90c8-cf5418d5a741) | Cada opção já mostra o **número calculado** que ela produz. | D30/D60/D90 mostram a data resultante dentro da própria opção ("D30 · 11 NOV"). |
| [Noom · plano personalizado](https://mobbin.com/flows/0f88ecd3-ceb0-43d1-af33-6feafe56928b) | "Based on your answers, Sam…" é bom. **Antipadrões:** loader falso ("Cross-checking with database…") e contador de urgência. | Usamos só a devolução personalizada. Sem loaders falsos nem atrasos artificiais. |
| [Monarch · Dashboard](https://mobbin.com/flows/7b05e907-74f2-43bb-95bd-cbfa39104f7f) | Checklist "Getting started" na Home, para completar o perfil depois. | Perfil progressivo: o que não gera valor agora (especialidade, mais locais, preferências) fica para a Home e o Perfil. |

**Aprendizados principais**
1. Nomear o problema antes de perguntar.
2. Uma pergunta de intenção que muda o caminho.
3. Mostrar a consequência dentro da própria opção.
4. Devolver uma frase personalizada logo depois da resposta.
5. Terminar num "plano" com o nome da pessoa.
6. Nunca usar loader falso, nem paywall antes do valor.

---

## 2. Problemas do onboarding atual

1. **Abertura genérica.** "Vamos deixar a DOKH mais com a sua cara" não diz qual problema a DOKH resolve, então as perguntas seguintes não têm justificativa.
2. **Pergunta → pergunta → pergunta.** Nome, situação e bolsa não devolvem nada até a tela 12. O único payoff intermediário é estático.
3. **Primeiro trabalho obrigatório para todos.** A tela 12 não tem `Pular`. O residente, que já tem uma fonte de renda real, precisa inventar um trabalho para entrar.
4. **Contexto destruído a cada tela.** No trabalho, só o chip do tipo sobrevive; local, data e valor somem quando a tela troca. A sensação é de formulário.
5. **A relação trabalho → dinheiro, o conceito central, não aparece.** Valor e previsão dividem uma tela, e a data resultante de D30 não se conecta visualmente à data do trabalho.
6. **O total da conclusão mistura caixa e competência.** `summaryTotals` soma a bolsa mensal com o valor do trabalho, sem considerar o mês da entrada, e inclui um trabalho "sem previsão". Isso contraria a regra de que um valor sem data de entrada fica fora do total de caixa do mês.
7. **Sem personalização.** Todo mundo vê a mesma narrativa. O nome é o único dado que muda a copy.
8. **Progresso burocrático.** "Etapa X de Y" mede o formulário, não o produto sendo montado.
9. **Prévia da tela 04 desconectada.** Os cards de exemplo da criação de conta somem e não voltam. É uma oportunidade de continuidade perdida.
10. **Motion decorativa.** As entradas em cascata são bonitas, mas não explicam relação nem construção.

---

## 3. Storyboard

Objeto central: **a peça**, um card DOKH que nasce vazio e ganha camadas a cada resposta. A peça vive no **layout do grupo de onboarding** (acima das telas), não dentro de cada tela, por isso persiste e anima entre etapas em vez de ser recriada.

| # | O que a pessoa vê | O que entende | Responde | Objeto que evolui | Transição |
| --- | --- | --- | --- | --- | --- |
| 0 | Splash + Criar conta (sem mudança) | — | Método de conta | Os três cards de exemplo da prévia | Os cards da prévia "descem" e viram as peças soltas da abertura |
| 1 | **Abertura · fragmentação** (escuro). Três peças soltas: *Hospital São Lucas · Plantão 12h*, *Clínica Central · Atendimento*, *Residência*. Texto: "Seu trabalho acontece em vários lugares." | Minha rotina é espalhada | — (toque avança) | As peças aparecem desalinhadas | — |
| 1b | As peças recebem chips bronze **D30 · Dia 05 · D60**. "E o dinheiro nem sempre entra quando você trabalha." | Trabalhar ≠ receber | — | Os chips encaixam nas peças | — |
| 1c | As peças se alinham numa coluna ligada por uma linha. "A DOKH conecta seus trabalhos aos seus recebimentos." CTA **Configurar minha DOKH** | A DOKH organiza isso | CTA | As peças se ordenam | As peças de exemplo saem; fica uma moldura vazia, **a sua DOKH** |
| 2 | Nome | Vai ser pessoal | Primeiro nome | A moldura ganha o título "DOKH de João" | Título sobe para o topo |
| 3 | **Foco**: "O que você mais quer organizar?" Trabalhos / Recebimentos / Ganhos. A opção escolhida expande com a mini-sequência | A DOKH vai começar pelo que importa para mim | 1 opção | Mini-sequência dentro da opção | A mini-sequência encolhe e vira a etiqueta de foco na moldura |
| 4 | Situação profissional (mantida). O subtítulo muda pelo foco | Por que perguntam: define de onde vem a renda | Residente / Generalista / Especialista (+ programa ou especialidade, como hoje) | A moldura ganha a etiqueta da situação | Residente → 5. Demais → 7 |
| 5 | **Bolsa** (valor + dia). A peça RESIDÊNCIA se monta ao vivo: programa → R$ 4.106/mês → todo dia 05 | A bolsa vira entrada recorrente | Valor, dia | Peça RESIDÊNCIA completa | A peça se fixa na moldura |
| 6 | **Payoff parcial · residente** (escuro). "Sua DOKH está começando a tomar forma." A peça RESIDÊNCIA e as próximas 3 entradas reais (05 OUT, 05 NOV, 05 DEZ). Pergunta: "Você também faz plantões, atendimentos ou procedimentos?" **Adicionar um trabalho** / **Ainda não** | Já existe valor sem mais nada | Escolha | Mini-linha do tempo de entradas | Adicionar → 8. Ainda não → 10 |
| 7 | **Ponte · sem residência** (escuro). "Vamos adicionar um trabalho para montar sua primeira visão." Uma peça tracejada com os encaixes *Tipo · Local · Data · Valor · Entrada* vazios. Copy varia pelo foco | O dado é necessário porque gera a visão | CTA | Peça vazia com encaixes | A peça tracejada desce para o topo da coleta |
| 8 | **Construção do trabalho** numa só rota com etapas internas e a peça fixa no topo: **8a** Tipo · **8b** Local · **8c** Data (+ horário/duração conforme o tipo) · **8d** Valor | Estou montando um objeto | Um campo por etapa | A cada resposta um encaixe preenche: `PLANTÃO` → `· Hospital São Lucas` → `12 OUT · 19h–07h` → `R$ 1.500` | Animação de layout: o encaixe recebe o valor e a peça cresce |
| 9 | **Previsão de entrada**: data, D30, D60, D90 ou Ainda não sei. Cada atalho mostra a data resultante. Abaixo da peça aparece a ligação **12 OUT → D30 → 11 NOV** | Trabalho vira dinheiro numa data | Uma opção | A peça ganha a ponta bronze "Entrada prevista · 11 NOV" ou "Entrada a definir" | A peça completa se solta para o payoff |
| 10 | **Payoff final · clareza** (escuro → creme). As peças (residência e/ou trabalho) se reorganizam numa visão: **Sua DOKH está pronta, João.** Entradas por mês (caixa), Próximo trabalho, contagem do que foi cadastrado. CTA **Ver minha DOKH** | Agora enxergo minha rotina | CTA | As peças viram as linhas da visão mensal | Home + guia de primeiro uso |

**Personalização pelo foco** (leve; um fluxo só):

| Foco | Mini-sequência (3) | Copy da ponte (7) e do subtítulo (4) | Ordem no payoff (10) | Guia de primeiro uso |
| --- | --- | --- | --- | --- |
| Trabalhos | Onde · Quando · Quanto | "Vamos começar organizando como seus trabalhos acontecem." | Próximo trabalho primeiro, depois as entradas | Começa pela Agenda |
| Recebimentos | Trabalho → D30 → Entrada | "Vamos conectar seus trabalhos às datas em que o dinheiro deve entrar." | Linha do tempo de entradas primeiro | Começa por Finanças (entradas) |
| Ganhos | Plantões + Residência → Mês | "Vamos começar entendendo de onde vem sua renda." | Total do mês por fonte primeiro | Começa pela Home (valores do mês) |

**Motion: o que cada animação explica**
- Peças soltas → alinhadas (1): a fragmentação vira organização.
- Chips de pagamento encaixando (1b): o dinheiro tem outra data.
- Encaixe preenchendo (5, 8, 9): construção, ou seja, "este dado foi para cá".
- Ligação 12 OUT → D30 → 11 NOV (9): a relação trabalho → dinheiro.
- Reorganização final (10): as peças se encaixaram.
- Duração: 200–450 ms por mudança; sem confete, parallax ou loader. Com **Reduzir movimento**, tudo aparece no estado final e a ordem de leitura é a mesma.

---

## 4. Fluxo final

**Residente**
- Sem outro trabalho: 1 → 2 → 3 → 4 → 5 → 6 (**Ainda não**) → 10 (só a residência) → Home.
- Com trabalho: 1 → 2 → 3 → 4 → 5 → 6 (**Adicionar um trabalho**) → 8a–8d → 9 → 10 (residência + trabalho) → Home.

**Generalista:** 1 → 2 → 3 → 4 → 7 → 8a–8d → 9 → 10 (só o trabalho) → Home.

**Especialista:** igual ao generalista. A especialidade continua sendo pedida no passo 4 (ver decisão D-2).

Regras do payoff (10):
- Residência + trabalho: os dois.
- Só residência: só residência e suas próximas entradas reais.
- Só trabalho: só o trabalho.
- Sem horário opcional: sem linha de horário.
- Sem previsão: "Entrada a definir", **fora** do total do mês.
- O total é sempre **por mês de entrada (caixa)**. Um plantão em 12 OUT com D30 entra em **novembro**, não em outubro.

---

## 5. Pergunta → consequência

| Pergunta | Dado | Consequência no produto agora |
| --- | --- | --- |
| Nome | João | Moldura "DOKH de João", copy das telas, título do payoff, saudação da Home |
| Foco | Recebimentos | Mini-sequência, copy das pontes, ordem do payoff, primeira etapa do guia |
| Situação | Residente | Abre o ramo da bolsa; etiqueta do Perfil |
| Programa da residência | Clínica Médica | Nome da peça RESIDÊNCIA e da fonte em Finanças |
| Bolsa | R$ 4.106 | Entradas recorrentes em Home/Finanças; payoff parcial |
| Dia | 05 | Datas reais das próximas entradas (payoff 6 e 10) |
| Também faz trabalhos? | Ainda não | Termina o onboarding sem trabalho inventado |
| Tipo | Plantão | Define os campos (horário e duração obrigatórios); ícone da peça |
| Local | Hospital São Lucas | Local reutilizável na Agenda e em próximos trabalhos |
| Data (+ horário) | 12 OUT · 19h | Próximo trabalho na Agenda, na Home e no payoff |
| Valor | R$ 1.500 | Valor em Finanças |
| Previsão | D30 → 11 NOV | Entrada prevista em novembro; ou "a definir", fora do total |

Perguntas questionadas:
- **Especialidade do especialista:** hoje não muda nada além da etiqueta do Perfil (D-2).
- **Generalista vs. especialista:** só muda a etiqueta e a copy. Mantida porque a 11.10 exige escolha explícita.
- **"Qual procedimento?":** anotado no design antigo, mas sem consequência no onboarding. Fica fora.

---

## 6. Decisões para o usuário

- **D-1 · Guardar o foco?** Recomendo uma coluna `profiles.onboarding_focus` (`work` / `receivables` / `earnings`), para a Home e o guia lerem depois. Alternativa: só em memória durante a sessão, sem migration, mas a personalização morre ao reabrir o app.
- **D-2 · Especialidade do especialista no onboarding?** A 11.10 exige a especialidade para Especialista. Pelo princípio deste brief, ela poderia ir para o Perfil. Recomendo **manter** agora, porque já existe, é uma busca rápida e alimenta o Perfil; mas a tela deve deixar claro para que serve.
- **D-3 · Soft upsell depois do payoff?** Recomendo **não ter** no MVP: o payoff ainda não tem dados para "interpretar" (Free organiza, Premium interpreta). O Premium aparece no contexto certo depois (valor/hora, recorrência).
- **D-4 · Abertura com toque ou automática?** Recomendo três batidas que avançam **por toque**, com a primeira começando sozinha, para não haver atraso artificial. Com Reduzir movimento, as três aparecem empilhadas.

## 7. Impacto técnico (após aprovação)

- Novo layout do grupo `(onboarding)` com a moldura e a peça persistentes, via `LinearTransition`/`Layout` do Reanimated. As telas viram conteúdo abaixo da peça.
- O primeiro trabalho vira **uma rota com etapas internas** (8a–9), reaproveitando `WorkTypeScreen`, `LocationField`, `WorkDateSheet`/`ScheduleSheets` e `PaymentSheet`.
- `summaryTotals` passa a agrupar **por mês de entrada** e a excluir "sem previsão". Isso corrige o problema 6 também no fluxo atual.
- A residência sem trabalho conclui o onboarding (`onboarding_completed_at`) direto do passo 6.
- Migration opcional para o foco (D-1). O guia de primeiro uso ganha uma ordem por foco.
- Atualizar `docs/screens/onboarding.md` e registrar a divergência do HTML original, aprovada pelo usuário.
- Fatiamento sugerido: (1) correção do total + residente pode concluir; (2) abertura narrativa + foco; (3) peça persistente no trabalho + previsão com ligação; (4) payoff novo + guia por foco.
