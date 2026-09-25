# BottomSheet — tarefa 2.5 (recorte)

Fontes visuais: `design/agenda.html` — Agenda 08 (data), 09 (duração), 10 (pagamento), 11–14 (recorrência e cor) e 06B (tipo); `design/financas.html` (folhas explicativas). Decisões: D17 (sheets controlados, retorno previsível, voltar do Android) e D11 (Reanimated, reduzir movimento).

- Duas variações medidas nos HTMLs (tokens `bottomSheetMetrics`, sombras `shadow.sheet`/`shadow.sheetMenu`):
  - `standard` (Agenda 08–14, Finanças): raio superior 32, padding 14/24/36, alça 40×4 `rgba(16,22,15,0.2)`, sombra 0 −20 60 a 25%, espaço de 18 entre blocos.
  - `menu` (Agenda 06B): raio 28, padding inferior 40, alça 36×4 a 18%, sombra a 35%, espaço de 20.
- Fundo: o HTML esmaece a tela de trás (opacidade 0,35 / 0,5). Em RN isso vira um véu creme por cima: 65% no padrão, 50% no menu.
- Controle: `open` pertence à tela; o componente só chama `onClose`. Fecha pelo toque no fundo, pela alça (alvo de 44), por arrastar para baixo (> 25% da altura ou velocidade > 900), pelo voltar do Android (`onRequestClose`) e pelo gesto de escape do VoiceOver.
- Acessibilidade: painel com `accessibilityViewIsModal` e nome da folha; o fundo fica fora do leitor de tela, que fecha pela alça ("Fechar") ou pelo escape.
- Motion: sobe em 250 ms e desce em 200 ms (tokens `motion`); com "Reduzir movimento" aparece e some sem animação (`src/theme/useReducedMotion.ts`, sobre `AccessibilityInfo`). O motion refinado é a 2.7.
- Margens: padding inferior = maior entre o do HTML e a área segura + 16; altura máxima abaixo da área segura superior. Fora de um `SafeAreaProvider` usa margem zero.
- Não incluído: teclado (nenhuma folha desenhada tem campo de texto), alturas fixas/snap points e rolagem interna longa. Adicionar quando uma tela precisar.
- Catálogo `/dev/primitives`, seção **Bottom sheet**: abre a folha padrão com o calendário de Agenda 08 e a de menu com o seletor de tipo de Agenda 06B.

Os HTMLs de referência não foram alterados. Inspeção visual/VoiceOver no iPhone e Android/TalkBack (incluindo o botão voltar) seguem pendentes.
