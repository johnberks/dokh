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

- **Quando aparece:** só ao tocar em "Ir para o início" na conclusão do onboarding (`OnboardingDoneScreen`). Contas existentes nunca veem o tour.
- **Estado:** fica em memória (`useGuideTour`, zustand). Nada é gravado (D20), e fechar o app no meio encerra o tour.
- **Alvos:** `useTourTarget(id)` dá o `ref`/`onLayout` do elemento e mede na janela 750 ms depois do passo ficar ativo, o tempo da troca de aba e da cascata. Se o alvo não existir, o balão aparece centralizado, sem recorte.
- **Overlay:** `GuideTourOverlay` fica no layout das abas. Véu escuro em quatro faixas deixa o alvo aceso, com um anel creme. O balão fica embaixo do alvo ou em cima, se não couber. A tela troca de aba sozinha.
- **Saída:** "Pular" encerra na hora, em qualquer passo. "Concluir" (último passo) volta ao Início.
