# PremiumGate e PremiumBadge — tarefa 2.5 (recorte)

Fontes visuais: `design/agenda.html` — Agenda 12 (recorrência Free) e 14 (cor Free); selo e cadeado também em `design/financas.html`. Regras: `docs/screens/agenda.md` e `docs/screens/financas.md` (Free e Premium), D49, D50 e `docs/billing-readiness.md`.

- `PremiumBadge`: selo informativo (não é botão) com cadeado de traço 1,4 e IBM Plex Mono 9 em bronze escuro sobre borda bronze a 55%. `size="full"` = "DOKH PREMIUM" (folhas da Agenda); `size="short"` = "PREMIUM" (cartões de Finanças).
- `PremiumGate`: conteúdo da folha Free, na ordem obrigatória **valor → explicação → oferta**:
  1. selo, título do benefício (Archivo 26/600) e descrição (14);
  2. `preview` — a prévia **real** do recurso (as opções de verdade), esmaecida, sem interação e oculta do leitor de tela, que ouve "Prévia do recurso Premium"; `fadePreview` aplica o degradê creme de Agenda 12;
  3. `showAvailability` — pílula escura "Disponível no Premium";
  4. CTA "Conhecer DOKH Premium →" (56, raio 16, seta bronze) que chama `onLearnMore`, destinado ao fluxo de benefícios de 4 slides — **nunca** direto ao paywall (D50);
  5. saída Free sempre presente (`freeExitLabel` + `onContinueFree`), ex.: "Continuar sem recorrência", "Usar cor automática".
- Contrato: o gate **não consulta plano** nem bloqueia salvamento. A tela decide mostrá-lo a partir do entitlement (provider abstrato da Fase 5, ver `docs/billing-readiness.md`) e o servidor revalida qualquer escrita Premium. Sem preço, compra ou números inventados dentro do gate.
- Fora do escopo: os teasers inline de Finanças (Origem das entradas, valor/hora, evolução, projeção) têm estruturas próprias com `•••` em posições específicas e pertencem às tarefas 9.5/9.6; eles reutilizam `PremiumBadge`.
- Catálogo `/dev/primitives`, seção **Premium gate**: abre as folhas de Agenda 12 e 14 dentro do `BottomSheet` e mostra a última ação escolhida.

Os HTMLs de referência não foram alterados. O texto do selo em bronze sobre creme tem contraste de ~3,4:1, mantido do HTML (mesma decisão já registrada para os rótulos do Review Card); confirmar a legibilidade no iPhone.
