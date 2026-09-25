# Splash e carrossel de apresentação — tarefa 7.1

Fontes: `design/onboarding.html` (00B Splash, 01 Welcome/Plantões, 02 Entradas, 03 Ganhos) e `docs/screens/onboarding.md` (Entrada e apresentação). Decisões: D11 (Reanimated + reduzir movimento), D38 (nenhum texto fora do i18n), D20 (nada de domínio persistido no device).

## Fluxo

`Splash → slide 1 → slide 2 → slide 3 → criar conta`. `Pular` (em qualquer slide) e `Começar` (no slide 3) levam ao mesmo destino. Enquanto a tela 04 do HTML não existir (7.2), o destino é `/sign-up`, que já oferece link para `Entrar`.

Quem não tem sessão entra pela apresentação; depois dela, o guard da 4.5 passa a abrir `/sign-in` normalmente. A marcação "já viu" é **estado de sessão** (`src/features/onboarding/intro-state.ts`, Zustand, em memória): o app não grava nada no aparelho. **Lacuna:** reabrir o app mostra a apresentação de novo enquanto não houver sessão. Persistir essa preferência exige decisão de produto — o UX não define onde ela viveria nem se deve sobreviver à reinstalação.

## Splash 00B

- Fundo `#10160F`, símbolo de 96 e assinatura Unbounded 24 com espaço de 28.
- Motion: as duas superfícies começam afastadas em 26 e se aproximam até a interseção bronze aparecer (450 ms, `heroPage`); depois de 420 ms de leitura, o slide 1 entra sozinho.
- Com **Reduzir movimento**, a assinatura já aparece montada e o tempo de leitura é mantido.
- O símbolo é lido como imagem única chamada "DOKH". O desenho é o do Brand Kit; o vetor D1 final de produção continua pendente (2.2).

## Slides 01–03

- Cabeçalho com assinatura pequena e `Pular` (alvo de 44); título Archivo 600 (32, ou 28 em três linhas no slide 1) e corpo 15/1,55 em `#4A5744`.
- Ilustrações reproduzem janelas do produto do HTML (calendário + card de plantão; total a receber + barras + entradas; ganhos do mês + evolução + composição). São **exemplos**, não dados: o leitor de tela recebe um resumo por slide e o conteúdo interno fica oculto, sem números soltos fora de contexto.
- Rodapé: indicador com pílula bronze de 24×6 no slide ativo e pontos de 6 a 20% nos demais; CTA escuro de 56 com seta — `Continuar` nos dois primeiros, `Começar` no último.
- Navegação por swipe horizontal com limiar de 40 pontos, sem dar a volta nos extremos (`pageAfterSwipe`, função pura testada). O gesto falha cedo no eixo vertical para não competir com rolagem.
- A tela não coleta nem altera dados e não tem formulário.

## Limites

- A composição final da tela 04 (Criar conta, com Apple/Google/e-mail e links legais) é da 7.2; Apple e Google seguem indisponíveis até 4.3/4.4.
- Inspeção visual, VoiceOver e Android seguem pendentes pela DoD.
