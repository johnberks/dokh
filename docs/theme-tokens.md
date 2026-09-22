# Tokens visuais — tarefa 2.1

Fonte: `design/brand-kit.dc.html` (paleta C e tipografia escolhida 2C), com dimensões de uso observadas em `design/componentes.dc.html`. API em `src/theme/tokens.ts`, em pontos de React Native; motion em milissegundos.

- `palette` guarda valores brutos. `colors` nomeia os papéis: creme no fundo, base no texto claro, sálvia na hierarquia escura secundária, bronze apenas no acento raro (até 5% da tela). `negativeText` é o vermelho de texto sobre escuro; `negative` é preenchimento/ícone grande. Pendência é neutra, não erro.
- `fontFamilies` registra Archivo (interface), IBM Plex Mono (dados técnicos) e Unbounded 600 (somente wordmark). `typography` registra D1 58/60, H1 34/38, H2 22/28, corpo 15/25 e label 11 com tracking. Até a tarefa 2.2 carregar as fontes por `expo-font`, os estilos em execução usam `System` para não pedir uma fonte indisponível; 2.2 troca para aliases carregados e testa fallback.
- `spacing` é uma escala prática dos respiros recorrentes de 4–48; `radius` inclui cards 18/22 e tela 28 observados nos componentes. O Brand Kit não especifica escala de spacing ou radius de UI; o raio proporcional de 8% se refere ao símbolo, não a cards.
- `shadow` aproxima as sombras neutras dos cards na API nativa iOS/Android, sem prometer reproduzir o brilho *inset* do HTML. `motion.feedback` = 200 ms vem da transição da confirmação no catálogo. `enter`/`exit` e `zIndex` são convenções iniciais, não valores normativos do Brand Kit; animação, reduce motion e camadas de navegação serão validados em 2.7/2.4.

Os HTMLs de referência permanecem intactos. Os placeholders consomem tokens sem carregar fontes antecipadamente; a implementação visual final das telas não faz parte da 2.1.
