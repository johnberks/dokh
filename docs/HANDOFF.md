# Passagem de trabalho — estado atual do DOKH

> Leia este arquivo **antes** de começar qualquer tarefa, seja no Claude Code ou no Codex.
> Atualize-o ao terminar uma sessão: o que foi feito, o que ficou pendente e por quê.

Última atualização: 2026-09-22 · Codex · Review Card da 2.5 parcial no PR draft #7 (`codex/2.5-review-card`).

## Onde paramos

A **Fase 0** e quase toda a **Fase 1** do `build-plan.md` estão implementadas. A **2.1 (tokens)** foi integrada no PR #2. Esta branch empilha os PRs draft #3 (fontes da 2.2), #4 (primitives da 2.3), #5 (navegação da 2.4) e #6 (estados técnicos da 2.6), e acrescenta o primeiro componente de domínio visual da 2.5: Review Card. As quatro telas ainda são placeholders: seus headers e conteúdos próprios serão montados nas tarefas de tela, sempre com HTML e UX correspondentes. A 2.2 ainda depende do SVG D1 final e de splash em build nativo; a 2.3, a 2.4, a 2.5 e a 2.6 ainda dependem de validação visual e VoiceOver em device. O usuário adiou a validação Android para um segundo momento. A **1.9 (EAS)** continua dependendo de conta Expo.

| Tarefa | Estado | O que falta para marcar `[x]` |
| --- | --- | --- |
| 0.1 Normalizar fontes | ✅ Concluída | — |
| 0.2 Instruções Codex | 🟡 Implementada | Abrir uma sessão Codex na raiz e confirmar que ele lê o `AGENTS.md` |
| 0.3 Git e proteção | 🟡 Parcial | Ativar proteção da `main` no GitHub (Settings → Branches) |
| 1.1 App Expo | 🟡 Verificada no iPhone 16 pelo usuário | Abrir no Android (Expo Go no celular ou emulador) |
| 1.2 Pastas e alias | ✅ Concluída | — |
| 1.3 Rotas | 🟡 Verificada só no iOS | Testar navegação e botão voltar no Android |
| 1.4 Ambientes/env | ✅ Concluída | — |
| 1.5 i18n | ✅ Concluída | — |
| 1.6 Estado e formulários | ✅ Concluída | — |
| 1.7 Qualidade local | ✅ Concluída | — |
| 1.8 CI | 🟡 Workflow passou no PR #2 | Tornar o check obrigatório na `main` e validar bloqueio de falha intencional |
| 1.9 EAS | ⏳ Não iniciada | Precisa de conta Expo (`npx eas-cli login`) |
| 2.1 Tokens do Brand Kit | ✅ Integrada no PR #2 | — |
| 2.2 Fontes e assets | 🟡 Fontes no PR draft #3 e nesta prévia | Vetor D1 final aprovado, splash/ícones e validação nativa |
| 2.3 Primitives acessíveis | 🟡 Código no PR draft #4 e nesta prévia | Inspeção visual e VoiceOver no iPhone; Android/TalkBack depois |
| 2.4 Navegação visual | 🟡 Barra inferior e controle voltar/fechar no PR draft #5 | Headers de telas reais, inspeção 390×844/iPhone com notch e Android depois |
| 2.5 Componentes de domínio visual | 🟡 Review Card no PR draft #7 | Nove componentes restantes, aplicação em telas, iPhone/VoiceOver e Android/TalkBack depois |
| 2.6 Estados técnicos | 🟡 Componentes e catálogo no PR draft #6 | Inspeção visual, VoiceOver no iPhone e Android/TalkBack depois |

## Como rodar o projeto

```bash
cd /Users/joaolucasberlinck/Documents/Codex/2026-09-21/leia-docs-handoff-md-e-agents/work/dokh-2.5-review-card
fnm exec --using=22 node -v   # Node 22 (.nvmrc)
cp .env.example .env.local   # se ainda não existir
fnm exec --using=22 npm ci
fnm exec --using=22 npm run start -- --clear  # QR code para o Expo Go
```

Até a tarefa 3.1 (Supabase local), o `.env.local` pode usar valores provisórios:

```text
EXPO_PUBLIC_APP_ENV=local
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=replace-after-supabase-start
```

Checks obrigatórios antes de concluir qualquer tarefa:

```bash
npm run typecheck && npm run check && npm test && npm run check:agents
```

## O que já existe no código

- **Rotas** (`app/`): grupos `(auth)`, `(onboarding)` e `(tabs)`; telas provisórias de Início, Agenda, Finanças e Perfil; o `+` central abre o modal `work/new` sem ser uma tab.
- **Ambiente** (`src/config/env*.ts`): valida `EXPO_PUBLIC_*` na inicialização e mostra erro claro quando falta variável.
- **i18n** (`src/i18n/`): um namespace por feature, chaves tipadas. Texto literal em JSX quebra o teste `src/test/no-hardcoded-text.test.ts`.
- **Estado** (`src/data/query-client.ts`, `src/features/app-shell/AppProviders.tsx`): TanStack Query só em memória, revalida ao voltar ao app e ao reconectar.
- **Regras de camada**: o Biome impede, por exemplo, `src/domain` de importar React Native (`biome.json` > `overrides`).
- **Billing**: nada implementado de propósito. `docs/billing-readiness.md` lista o que não pode mudar (bundle `com.dokh.app`, `app_user_id` = UUID do Supabase, entitlement `premium`).
- **Tokens** (`src/theme/tokens.ts`, `docs/theme-tokens.md`): paleta e papéis semânticos, tipografia, spacing, radius, shadow, motion e z-index. `PlaceholderScreen` usa tokens.
- **Fontes (2.2 parcial)**: Archivo 400/500/600/700, IBM Plex Mono 400/500 e Unbounded 600 via `@expo-google-fonts` + `expo-font`. `BrandFontProvider` segura o splash até carregar ou falhar; o placeholder usa Archivo carregada ou `System` no fallback. O splash atual ainda usa a imagem genérica anterior; o Brand Kit diz que o desenho D1 no HTML não é o vetor final de produção.
- **Primitives (2.3 parcial)**: `src/components/` contém Text, Button, IconButton, Input, SegmentedControl, Toggle, Chip, Divider, Card, Screen e ScrollScreen. Catálogo interno em `/dev/primitives` apenas em desenvolvimento, acessível por botão na Home provisória; detalhes em `docs/primitives.md`. Nesta prévia, `AppText` e `Input` adotam Archivo ao carregar e `System` se a fonte falhar.
- **Navegação (2.4 parcial)**: `BottomTabs` segue a geometria e tipografia dos quatro HTMLs de tabs; centro abre o modal sem selecionar tab. `NavigationControl` fornece alvo acessível de voltar/fechar; o topo do modal de criação usa a copy de `Agenda 06`. Detalhes e lacunas em `docs/navigation.md`.
- **Estados técnicos (2.6 parcial)**: `Skeleton`, `LoadError`, `MutationError` e `OfflineBanner` seguem as regras de `AGENTS.md`, sem inventar valores ou confundir erro com vazio. `docs/technical-states.md` descreve uso e lacunas; o catálogo interno demonstra os estados.
- **Review Card (2.5 parcial)**: variantes compacto/padrão/detalhado/atenção conforme `design/componentes.dc.html`, seleção de no máximo dois por tela e até dois previews, com exemplo no catálogo interno. `docs/review-card.md` detalha contrato, medidas e divergência deliberada da confirmação instantânea do mock.

## Armadilhas já encontradas

- Instalar libs Expo/nativas com `npx expo install`. O `npm install` direto puxou `react-dom` incompatível.
- `npx expo install ... -- --save-dev` colocou pacotes de teste em `dependencies`; conferir o `package.json`.
- RNTL 14: `render` e `fireEvent` são assíncronos. Sempre `await`.
- `renderRouter` não aguarda o render; usar o helper `openAt` de `src/test/routes.test.tsx`.
- QueryClient de teste precisa de `gcTime: Infinity` em queries e mutations, senão o Jest não encerra.
- Não usar `new URL().hostname` no app: a implementação de URL do React Native é incompleta.
- `lucide-react-native` é mapeado para o build CJS só no Jest (`package.json` > `jest.moduleNameMapper`).
- `npx expo-doctor` pode falhar se o cache global npm não for gravável. Neste ambiente, `npm_config_cache=/private/tmp/dokh-npm-cache npx expo-doctor` executou 21/21 checks.

## Evidência da tarefa 2.1

- `npm run typecheck`: passou.
- `npm run check`: passou.
- `npm test -- --runInBand`: 8 suítes, 29 testes passaram. Na primeira execução fria, um teste de rota preexistente excedeu 5 s; a repetição completa passou.
- `npm run check:agents`: passou.
- `npm_config_cache=/private/tmp/dokh-npm-cache npx expo-doctor`: 21/21 checks passaram.
- `src/theme/tokens.test.ts` valida o mapeamento de marca e impede hex/família inline no componente de demonstração.

## Evidência parcial da tarefa 2.2

- Usuário confirmou abertura do projeto em iPhone 16; não há confirmação de navegação completa nem build nativo de release.
- Fontes: `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (9 suítes, 32 testes), `npm run check:agents` e `expo-doctor` (21/21) passaram.
- `BrandFontProvider.test.tsx` cobre espera, carregamento e fallback após falha.
- **Não marcar `[x]` ainda:** falta receber/aprovar o SVG final D1, aplicá-lo ao app/splash e verificar tamanhos mínimos e splash em build nativo. Expo Go não reproduz fielmente o splash.

## Evidência parcial da tarefa 2.3

- No PR #4, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (9 suítes, 37 testes), `npm run check:agents` e `expo-doctor` (21/21) passaram.
- Testes cobrem estados de botão/campo, seleção, acessibilidade, alvo 44×44, contraste AA e deep link do catálogo.
- O simulador iOS abriu, mas `simctl` não conseguiu conectar ao CoreSimulatorService neste ambiente; sem validação visual e VoiceOver/TalkBack, **não marcar `[x]`**.

## Prévia integrada para iPhone

- Branch local `codex/2.3-ios-preview` combina os PRs #3 e #4 sem mesclá-los em `main`.
- `AppText` e `Input` usam as fontes carregadas pelo `BrandFontProvider`, com fallback testado.
- O botão **Componentes básicos** na Home abre o catálogo. Confirmar visual e navegação com VoiceOver no iPhone 16; splash nativo não é validado no Expo Go.
- `npm ci` em checkout limpo, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (10 suítes, 42 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram com Node 22.
- `npx expo export --platform ios` gerou o bundle iOS sem erro. O script `generate-route-types.mjs` passou a criar `.expo/types` antes de chamar a geração do Expo Router; no checkout limpo ele antes imprimia ENOENT sem falhar o processo.
- O teste no iPhone 16 com VoiceOver ainda precisa da confirmação do usuário; bundle/export não provam aparência ou comportamento no device.

## Evidência parcial da tarefa 2.4

- HTMLs de Home, Agenda, Finanças e Perfil conferidos para extrair a barra de 390×844; `Agenda 06` e `07` para controles de fechar/voltar. Os arquivos de referência não foram alterados.
- A barra mantém quatro tabs, fonte IBM Plex Mono 9 e ação central de 56 pontos. O modal fecha para a tab anterior e o controle visível de 40 tem alvo de 44 pontos.
- A revisão de boas práticas React levou a imports diretos de ícones Lucide e pesos de fonte usados: o bundle iOS caiu de 5,6 MB/3357 módulos para 3,6 MB/1482 módulos. O mapper do Jest foi ajustado para os subcaminhos CJS; nenhum visual ou família foi alterado.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (11 suítes, 46 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22.
- O `simctl` continua sem acesso ao CoreSimulatorService neste ambiente; inspeção visual no iPhone 16 e VoiceOver ainda dependem do usuário. Não marcar a 2.4 como concluída.
- PR draft #5 usa `codex/2.3-ios-preview` como base temporária para manter o diff da 2.4 isolado; não mesclar em `main` antes dos PRs #3 e #4.

## Evidência parcial da tarefa 2.6

- Os HTMLs de Home/Agenda/Finanças/Perfil não desenham skeleton, erro de rede ou offline; nenhum foi editado. Os componentes usam a paleta, fontes e espaçamentos existentes.
- Skeletons não contêm valores; `LoadError` apresenta retry acessível; `MutationError` não controla o formulário e só expõe retry quando o chamador informa uma operação idempotente; `OfflineBanner` distingue dados em memória potencialmente desatualizados.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (12 suítes, 51 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22.
- PR draft #6 usa a branch da 2.4 como base temporária para manter o diff isolado; seguir a ordem #3 → #4 → #5 → #6, sem mesclar diretamente em `main`.
- A integração com queries, o envio sanitizado ao Sentry e a validação em tela real virão com as features correspondentes. Não marcar a 2.6 como concluída sem validação visual/VoiceOver e Android/TalkBack posteriormente.

## Evidência parcial da tarefa 2.5

- O Review Card usa medidas, cores e famílias de fonte de `design/componentes.dc.html`; `docs/screens/home.md` e `docs/screens/financas.md` definem os limites e comportamento.
- O componente nunca confirma recebimento sozinho: apenas aciona callback, bloqueia toque duplo enquanto ocupado e espera a feature remover o card após sucesso do servidor. Isso respeita a regra de domínio acima do toggle ilustrativo do HTML.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (13 suítes, 57 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. Testes cobrem os quatro estados, limite de previews/cards/atenção, alvo acessível e ausência de confirmação otimista.
- PR draft #7 usa a branch da 2.6 como base temporária; seguir a ordem #3 → #4 → #5 → #6 → #7, sem mesclar diretamente em `main`.
- O catálogo interno demonstra as quatro variações. Os outros nove componentes, integração nas telas reais e inspeção visual/VoiceOver/TalkBack ainda faltam; **não marcar a 2.5 concluída**.

## Pendências humanas (bloqueiam só o trecho relacionado)

- Android SDK/emulador ou celular Android com Expo Go (fecha 1.1 e 1.3).
- Validação Android/TalkBack da 2.3 adiada a pedido do usuário; não substitui a DoD original.
- Proteção da `main` no GitHub (fecha 0.3 e 1.8).
- Conta Expo/EAS (1.9), projetos Supabase preview/production (3.1).
- P01 preços, P02 arquivos do Plantãozinho, P03 recorrência custom, P04 textos legais, P05 confirmações destrutivas.

## Próximas tarefas sugeridas (em ordem)

1. **2.2** Finalizar o símbolo D1 e splash a partir do vetor final aprovado; fontes já estão no PR draft #3.
2. **2.3/2.4/2.5/2.6** Revisar catálogo, barra inferior, Review Card e estados técnicos no iPhone 16 com VoiceOver; Android/TalkBack depois. Continuar os nove componentes da 2.5 e, em seguida, os headers/conteúdos de Home/Agenda/Finanças/Perfil conforme HTML+UX.
3. **3.1** Supabase local (Docker e Supabase CLI já instalados) → **3.2–3.5** migrations e RLS.
4. **4.1/4.2/4.5** Sessão, e-mail/senha e guards.
