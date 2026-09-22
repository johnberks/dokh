# WorkTypeSelector — tarefa 2.5 (recorte)

Fontes visuais: `design/onboarding.html` (tela 06, "O que você quer registrar?") e `design/agenda.html` (06B, "O que você quer adicionar?"). Comportamento: `docs/screens/onboarding.md` e `docs/screens/agenda.md`. Tipos: `domain-model.md` (`work_entries.type`).

- `src/domain/work-type.ts` define `WORK_TYPES = ['shift', 'procedure', 'appointment']`, o guard `isWorkType` e `requiresSchedule` (só Plantão exige horário e duração). Residência **não** é tipo de Trabalho e nunca aparece no seletor.
- `variant="choice"` (Onboarding 06): rádio de escolha única que permanece marcado; o CTA `Continuar` da tela avança. Selecionado = borda 1,5 verde escura, superfície papel, sombra e círculo bronze com check. Não selecionado = sem preenchimento, borda 1 e anel vazio. Título Archivo 17/600.
- `variant="menu"` (Agenda 06B): lista de ações em superfície papel com chevron; tocar devolve o tipo e a tela segue para o formulário. Título Archivo 16/600.
- As descrições diferem entre os dois HTMLs e foram mantidas literalmente em `components.workType.<tipo>.choice|menu`.
- Geometria comum: raio 18, padding 16/18, gap 14, tile do ícone 42 com raio 12, ícone 20 com traço 1,7 (paths exatos do HTML em `WorkTypeIcon`, via `react-native-svg`). Tokens em `workTypeSelectorMetrics` e cores `workType*`.
- Acessibilidade: a área inteira da opção é o alvo (mínimo 44). `choice` expõe `radiogroup` + `radio` com `checked`; `menu` expõe `button`. A descrição vai como `accessibilityHint`. O grupo não é `accessible`, para o VoiceOver/TalkBack navegar opção por opção. A seleção nunca depende só de cor: borda, check e estado anunciado.
- O componente não navega, não persiste e não decide campos: devolve um `WorkType` tipado. O chip do tipo escolhido nas telas seguintes do onboarding e o texto "Sua residência já está cadastrada…" pertencem à tela (7.4).
- Catálogo: `/dev/primitives`, seção **Seletor de tipo**, com as duas variações.

Os HTMLs de referência não foram alterados. Inspeção visual e VoiceOver em iPhone, e Android/TalkBack, seguem pendentes pela DoD geral da 2.5.
