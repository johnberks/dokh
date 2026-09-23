# Movimento e rolagem contínua — 2.7

Fontes: `design/home.html`, `design/financas.html`, `design/componentes.dc.html`, UX de Home e Finanças, decisões D08/D11 e orientação explícita do usuário sobre a rolagem. Os HTMLs permanecem inalterados.

## Contrato

- `HeroCarousel` limita-se às páginas mês/histórico, mantém altura fixa, aceita swipe horizontal e pontos com alvo acessível de 44 pontos. O gesto horizontal falha cedo diante de movimento vertical, permitindo que a página inteira continue rolando. Sem histórico, a segunda página e os pontos não existem.
- `HeroBar` cresce a partir da base em 400 ms; a troca de página usa 450 ms. `ReviewCardStack` aplica saída curta de 200 ms e reacomoda os cards restantes **somente quando o chamador remove o item**. A confirmação financeira nunca acontece por animação local: a feature deve esperar o servidor.
- `useReducedMotion` acompanha a preferência do sistema; a política compartilhada `motionDuration` devolve duração zero para carrossel/barras/remoção. No stack, a saída e o rearranjo animados são omitidos. As ações, pontos e navegação continuam disponíveis.
- `TwoToneScrollScreen` é a estrutura para Home e Finanças: **um único ScrollView vertical contém o topo verde e o corpo bege**. O topo sobe com o restante da página; apenas a tab bar fica fora. A área segura superior é incluída no próprio topo, não num cabeçalho fixo. A composição visual final e a mudança de contraste da status bar durante a rolagem pertencem às tarefas 9.2/10.2.
- Não foram adicionadas transições decorativas entre tabs ou telas; a navegação nativa permanece estável. A fluidez no iPhone ainda deve ser observada no Expo Go ao montar as telas reais, especialmente gesto vertical começando sobre o carrossel e troca de mês sem salto.

O catálogo `/dev/primitives` contém uma demonstração interativa de swipe/pontos, barras e remoção/restauração de card sem dados financeiros reais: “Visão do mês” é somente o rótulo da página, não a Home pronta. Para evitar que o swipe de retorno do carrossel feche o catálogo no iOS, somente essa rota desativa o gesto nativo de voltar e oferece um botão “Voltar”; as rotas de produto mantêm a navegação nativa. Testes verificam composição da rolagem, altura fixa, paginação com movimento reduzido, remoção de card, retorno explícito e durações. `expo export --platform ios` verifica o bundle; não substitui inspeção no iPhone.
