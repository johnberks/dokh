# Passagem de trabalho — estado atual do DOKH

> Leia este arquivo **antes** de começar qualquer tarefa, seja no Claude Code ou no Codex.
> Atualize-o ao terminar uma sessão: o que foi feito, o que ficou pendente e por quê.

Última atualização: 2026-09-21 · Codex · 2.1 integrada; 2.2 e 2.3 em PRs draft.

## Onde paramos

A **Fase 0** e quase toda a **Fase 1** do `build-plan.md` estão implementadas. A **2.1 (tokens)** foi integrada no PR #2. A **2.2 (fontes)** está no PR draft #3, aguardando o SVG D1 final e teste do splash em build nativo. A **2.3 (primitives)** está em branch própria, aguardando validação visual e de leitor de tela em device. A **1.9 (EAS)** continua dependendo de conta Expo.

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
| 2.2 Fontes e assets | 🟡 Fontes no PR draft #3 | Vetor D1 final, splash/ícones e validação nativa |
| 2.3 Primitives acessíveis | 🟡 Código e testes nesta branch | Inspeção visual em iOS/Android e VoiceOver/TalkBack |

## Como rodar o projeto

```bash
cd ~/Desktop/dokh
fnm use                      # Node 22 (.nvmrc)
cp .env.example .env.local   # se ainda não existir
npm install
npm run start                # QR code para o Expo Go; tecla i abre o simulador iOS
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
- **Tokens** (`src/theme/tokens.ts`, `docs/theme-tokens.md`): paleta e papéis semânticos, tipografia com fallback temporário, spacing, radius, shadow, motion e z-index. `PlaceholderScreen` usa tokens. O carregamento das fontes reais permanece na 2.2.
- **Primitives (2.3 parcial)**: `src/components/` contém Text, Button, IconButton, Input, SegmentedControl, Toggle, Chip, Divider, Card, Screen e ScrollScreen. Catálogo interno em `/dev/primitives` apenas em desenvolvimento, acessível por botão na Home provisória; detalhes em `docs/primitives.md`.

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

## Evidência parcial da tarefa 2.3

- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (9 suítes, 37 testes), `npm run check:agents` e `expo-doctor` (21/21) passaram.
- Testes cobrem estados de botão/campo, seleção, acessibilidade, alvo 44×44, contraste AA e deep link do catálogo.
- O simulador iOS abriu, mas `simctl` não conseguiu conectar ao CoreSimulatorService neste ambiente; sem validação visual e VoiceOver/TalkBack, **não marcar `[x]`**.

## Pendências humanas (bloqueiam só o trecho relacionado)

- Android SDK/emulador ou celular Android com Expo Go (fecha 1.1 e 1.3).
- Proteção da `main` no GitHub (fecha 0.3 e 1.8).
- Conta Expo/EAS (1.9), projetos Supabase preview/production (3.1).
- P01 preços, P02 arquivos do Plantãozinho, P03 recorrência custom, P04 textos legais, P05 confirmações destrutivas.

## Próximas tarefas sugeridas (em ordem)

1. **2.2** Finalizar o símbolo D1 e splash a partir do vetor final aprovado; fontes já estão no PR draft #3.
2. **2.3** Revisar o catálogo `/dev/primitives` no iPhone/Android com VoiceOver/TalkBack; depois 2.6 estados técnicos → 2.4 navegação visual.
3. **3.1** Supabase local (Docker e Supabase CLI já instalados) → **3.2–3.5** migrations e RLS.
4. **4.1/4.2/4.5** Sessão, e-mail/senha e guards.
