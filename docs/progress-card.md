# ProgressCard — tarefa 2.5 (recorte)

Fonte visual: `design/home.html`, estados Home 01, 02 e 06. Fonte de comportamento: `docs/screens/home.md`, seção de progresso inicial. Os HTMLs são exemplos de estado, não uma definição fixa de milestones.

- O card usa superfície `#DCE0D6`, raio 22, inset 16, barra de 4 pontos, bandeja translúcida e linha de próxima ação conforme o HTML. Cores e medidas ficam em `src/theme/tokens.ts`.
- `completed`, `totalSteps` e `next` vêm da projeção da feature Home; o componente não calcula elegibilidade nem persiste conclusão. A residência não é pressuposta para toda pessoa.
- A barra acessível informa mínimo, máximo e valor atual. A ação expõe rótulo, estado ocupado e alvo mínimo de 44 pontos, bloqueando toques repetidos enquanto navega.
- Com todos os passos concluídos (ou total inválido), o objeto inteiro não renderiza. Não há card permanente em 100%, de acordo com o UX.
- O catálogo interno em `/dev/primitives` demonstra as três próximas ações visíveis nos HTMLs: adicionar datas, local e trabalho. A integração com dados reais, rotas de destino e seleção de milestones pertence à tarefa 10.5.

Validação atual: testes unitários de geometria, proporção, acessibilidade, estados ocupados e conclusão; `typecheck`, `check`, suíte completa, `check:agents`, Expo Doctor e export iOS. Inspeção visual/VoiceOver em iPhone e Android/TalkBack continuam pendentes; este recorte sozinho não fecha a DoD da 2.5.
