# Tokens visuais — tarefa 2.1

Fonte: `design/brand-kit.dc.html` (paleta C e tipografia escolhida 2C), com dimensões de uso observadas em `design/componentes.dc.html`. API em `src/theme/tokens.ts`, em pontos de React Native; motion em milissegundos.

- `palette` guarda valores brutos. `colors` nomeia os papéis: creme no fundo, base no texto claro, sálvia na hierarquia escura secundária, bronze apenas no acento raro (até 5% da tela). `negativeText` é o vermelho de texto sobre escuro; `negative` é preenchimento/ícone grande. Pendência é neutra, não erro.
- `fontFamilies` registra Archivo (interface), IBM Plex Mono (dados técnicos) e Unbounded 600 (somente wordmark). `typography` registra D1 58/60, H1 34/38, H2 22/28, corpo 15/25 e label 11 com tracking. A navegação 2.4 acrescenta IBM Plex Mono 400/600 a 9/12 para os rótulos das tabs e Archivo 600 a 30/32 para o modal, conforme os HTMLs. A implementação de fontes registra apenas os arquivos usados via `expo-font` no layout raiz: o app espera o carregamento antes de renderizar; se falhar, usa `System` sem ocultar a interface. `getTypography()` e `BrandFontProvider` separam esses dois estados e possuem testes.
- `spacing` é uma escala prática dos respiros recorrentes de 4–48; `radius` inclui cards 18/22 e tela 28 observados nos componentes. O Brand Kit não especifica escala de spacing ou radius de UI; o raio proporcional de 8% se refere ao símbolo, não a cards.
- `shadow` aproxima as sombras neutras dos cards na API nativa iOS/Android, sem prometer reproduzir o brilho *inset* do HTML. `motion.feedback` = 200 ms vem da transição da confirmação no catálogo. `enter`/`exit` e `zIndex` são convenções iniciais, não valores normativos do Brand Kit; animação, reduce motion e camadas de navegação serão validados em 2.7/2.4.
- `navigationMetrics` concentra a geometria da barra inferior e do controle do modal extraída dos quadros 390×844 de Home, Agenda, Finanças e Perfil; veja `docs/navigation.md`.
- O recorte 2.5 acrescenta a superfície de atenção `#E4D9C2`, o mini card `#FDFCF8`, o bronze escuro de textos/ícones e `reviewCardMetrics` com os raios e medidas A–D de `design/componentes.dc.html`; veja `docs/review-card.md`.
- `workLocationColors` mapeia somente os seis tokens de Local apresentados em `Agenda 13`; `workCardMetrics` contém as medidas dos cards de Agenda e Home, sem aceitar cor hexadecimal livre do cliente. Veja `docs/work-card.md`.
- `receivableRowMetrics` concentra data, timeline, ponto, painel e ação da linha de Recebível em `Finanças 05–10`; as cores dos três estados ficam em `colors`. Veja `docs/receivable-row.md`.
- `emptyStateMetrics` registra raios, paddings, alturas e alvo das superfícies vazias previstas nos HTMLs; `colors.empty*` concentra bordas tracejadas e hierarquia esmaecida. Veja `docs/empty-state.md`.
- `progressCardMetrics` registra a geometria do progresso inicial dos estados Home 01/02/06; `colors.progress*` preserva a superfície verde-clara, barra e bandeja do HTML. Veja `docs/progress-card.md`.
- `moneyInputMetrics` registra as medidas do valor compacto na Agenda e das duas entradas grandes do Onboarding; `colors.moneyFieldBorder` corresponde à borda vazia da Agenda. Veja `docs/money-input.md`.

Os HTMLs de referência permanecem intactos. Os placeholders consomem tokens sem carregar fontes antecipadamente; a implementação visual final das telas não faz parte da 2.1.
