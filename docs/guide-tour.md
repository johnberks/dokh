# Guia de primeiro uso (2026-09-28)

Pedido do usuário: um tour bem simples quando a pessoa cria uma conta, com opção de pular. Referências da Mobbin: [monday.com](https://mobbin.com/screens/8e52a60c-69ba-41b3-9828-3c9d44328ef6), [MD Vinyl](https://mobbin.com/screens/499c9722-98a4-42ac-9c3a-eb365a53f289) e [Mesh](https://mobbin.com/screens/eddbcaf5-e84e-49c2-9a17-ea528204eb81): balão com seta apontando o elemento, contador, Pular e Próximo.

| # | Aba | Alvo | Mensagem |
| --- | --- | --- | --- |
| 1 | Início | Card do mês (valor a receber) | Seu mês em um número |
| 2 | Início | Barra de abas | Tudo a um toque (inclui o `+`) |
| 3 | Agenda | Botão `+` | Registre um trabalho |
| 4 | Agenda | Calendário | Acompanhe seu mês |
| 5 | Finanças | Valor do topo | Entenda cada valor (ⓘ) |
| 6 | Finanças | Mês/Ano no topo direito | Veja o ano inteiro |

- **Ritmo:** a Início fica 3 s sozinha antes do primeiro passo (`motion.guideStartDelay`). O véu escurece em 700 ms, uma vez para o tour todo, e o balão e o anel chegam 250 ms depois, em 600 ms.
- **Passagem entre seções:** no último passo de uma seção, o botão diz **Ir para Agenda** ou **Ir para Finanças**. Ao tocar, a aba de destino acende na barra, com a legenda "Agora, vamos para a Agenda" e uma seta, por 1,3 s (`motion.guideTransition`); só então a tela troca. O balão mostra a seção (INÍCIO · AGENDA · FINANÇAS) ao lado do contador.
- **Quando aparece:** só ao tocar em "Ir para o início" na conclusão do onboarding (`OnboardingDoneScreen`). Contas existentes nunca veem o tour.
- **Estado:** fica em memória (`useGuideTour`, zustand). Nada é gravado (D20), e fechar o app no meio encerra o tour.
- **Alvos:** `useTourTarget(id)` dá o `ref`/`onLayout` do elemento e mede na janela 750 ms depois do passo ficar ativo, o tempo da troca de aba e da cascata. Se o alvo não existir, o balão aparece centralizado, sem recorte.
- **Overlay:** `GuideTourOverlay` fica no layout das abas. Véu escuro em quatro faixas deixa o alvo aceso, com um anel creme. O balão fica embaixo do alvo ou em cima, se não couber. A tela troca de aba sozinha.
- **Ordem pelo foco (7.7, `tourStepsFor`):** as seis etapas são sempre as mesmas, mas o guia começa pela seção do foco escolhido no onboarding:
  - Meus trabalhos → Agenda, Início, Finanças;
  - Meus recebimentos → Finanças, Início, Agenda;
  - Meus ganhos ou sem foco → Início, Agenda, Finanças (a ordem original).
  - A passagem de volta ao Início também acende a aba ("Ir para Início").
  - Os alvos (`useTourTarget`) leem o passo atual pelas etapas do estado. A ordem fixa fazia o guia começado pela Agenda medir o alvo errado (bug encontrado no iPhone em 2026-10-02). `currentTourStep` agora exige as etapas.
- **Saída:** "Pular" encerra na hora, em qualquer passo. "Concluir" (último passo) volta ao Início.
