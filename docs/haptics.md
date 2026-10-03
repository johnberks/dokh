# Vibração (haptics) — grupo 1

Pedido do usuário em 2026-10-03: vibração **só no grupo 1**, ou seja, confirmações importantes e as falhas delas. Seleção (calendário, chips) e limites de gesto (deslizar o card, abertura do onboarding) ficaram de fora por decisão dele. Decisão registrada em D79.

## Regra

- Vibrar quando o **servidor confirma** algo importante (`success`) ou quando essa confirmação **falha** (`error`).
- Nunca em toque comum, aba, digitação, rolagem, animação de entrada ou erro de carregamento.
- A vibração sai junto com o retorno visual, não antes dele.
- Tudo passa por `haptic(event)` em `src/theme/haptics.ts`:
  - iPhone: `notificationAsync(Success | Error)`, que respeita sozinho o ajuste "Hápticos do Sistema";
  - Android: `performAndroidHapticsAsync(Confirm | Reject)`, sem permissão de vibrador.
- Sem o módulo nativo (build anterior ao `expo-haptics`), nada acontece e nada quebra. O `expo-haptics` do SDK 57 carrega o módulo de forma opcional e `haptic` ignora a falha.

## Onde vibra

| Momento | `success` | `error` |
| --- | --- | --- |
| Salvar trabalho no `+` e salvar alterações na edição | `SaveWorkButton` fica verde com o check | `WorkForm`: falha ao gravar |
| Primeiro trabalho no onboarding | Gravou, antes de abrir a conclusão | Falha ao gravar |
| Marcar como recebido no detalhe | `SaveWorkButton` fica verde ("Recebido") | Falha ao confirmar |
| Recebido ao deslizar o card na Agenda | Servidor confirmou | Falha (o card continua aberto) |
| "Você recebeu?" na Home, na próxima entrada e em Entradas (Finanças) | Servidor confirmou | Falha |
| Fim do onboarding ("Sua DOKH está pronta") | Quando o valor em destaque termina de contar (`useCountUp(…, onDone)`); sem entradas, quando o título aparece. Uma vez por tela. | — |

## Build

`expo-haptics` é nativo. A vibração só aparece no iPhone depois de um **novo build de desenvolvimento**, e a produção também precisa de build novo. Até lá o app funciona igual, só sem vibrar.

## Testes

- `src/test/native-mocks.setup.ts` simula o `expo-haptics`.
- `src/theme/haptics.test.ts` cobre:
  - o mapeamento no iPhone e no Android;
  - o módulo ausente, sem quebrar.
- As telas conferem quando a vibração dispara:
  - Agenda e detalhe;
  - formulário e primeiro trabalho;
  - Home, Finanças e Entradas;
  - conclusão do onboarding.
