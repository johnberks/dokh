# Animações do onboarding (2026-09-27)

Pedido do usuário: animar o splash, a tela 04 (criar conta), a conclusão do perfil e a conclusão do primeiro trabalho, e preencher a conclusão de quem não é residente. Referências da Mobbin: Buddy, Duolingo, Jomo e Instagram (conclusões com resumo e entrada em cascata).

- **`Reveal`** (`src/components/Reveal.tsx`) faz fade com uma subida curta (e escala opcional) depois de `delay`. `step(n)` monta a cascata com `motion.revealStagger` (80 ms), e a duração é `motion.reveal` (460 ms).
- **`WordReveal`** faz o título entrar palavra por palavra. O leitor de tela lê a frase inteira como `header`.
- Com "Reduzir movimento", tudo aparece montado na hora (D11).

| Tela | O que anima |
| --- | --- |
| Splash 00B | O símbolo cresce (0,78 → 1) enquanto as superfícies se aproximam; a interseção bronze estala (back easing); as letras D-O-K-H sobem uma a uma; a saída tem fade e cresce 4%. Total de ~1,65 s. |
| Tela 04 | Marca → título palavra a palavra → os três cartões da prévia em cascata → botões → aviso legal. |
| Conclusão do perfil | Marca → símbolo → card (assenta com escala) → itens → título → texto → botão. Generalista e especialista ganham no card a lista "A DOKH vai acompanhar" (plantões, quando entra cada pagamento, quanto o trabalho rende). |
| Conclusão do primeiro trabalho | Marca → total contando até o valor (`useCountUp`) → cards de residência e trabalho → título → texto → botão. |
