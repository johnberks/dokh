# Primitives compartilhadas — tarefa 2.3

Implementação em `src/components/`, usando somente tokens de `src/theme/tokens.ts` e `StyleSheet`. A tarefa não cria regras de domínio nem aplica Premium.

- `Text` (`AppText` no arquivo), `Button`, `IconButton` e `Input` aceitam rótulos passados pelo chamador; copy de produto continua no i18n. Botões têm alvo mínimo 44×44, estados desabilitado/loading expostos ao leitor de tela e impedem duplo toque. `Input` preserva o valor em erro e expõe a mensagem por `accessibilityHint` e região ao vivo.
- `SegmentedControl` usa grupo/radios com seleção explícita; `Toggle` usa `Switch` nativo; `Chip` só tem alvo de 44 pontos quando interativo. A seleção não depende apenas de cor.
- `Divider`, `Card`, `Screen` e `ScrollScreen` fornecem superfície, respiro e safe area sem acoplar navegação ou dados. `ScrollScreen` permite rolagem e mantém o teclado utilizável.
- `/dev/primitives` é o catálogo interno, disponível apenas em builds de desenvolvimento. Demonstra estados normal/desabilitado/loading/erro e labels de acessibilidade; em release redireciona ao início. O HTML `design/componentes.dc.html` documenta Review Card, não estas primitives; formas iniciais seguem os tokens e as telas de referência.

Tests cobrem estados, semântica e contraste AA de texto no fundo claro. Validação visual e VoiceOver/TalkBack em device ainda são necessárias antes de marcar a DoD; o simulador iOS deste ambiente não aceitou conexão do `simctl`.
