# Passagem de trabalho — estado atual do DOKH

> Leia este arquivo **antes** de começar qualquer tarefa, seja no Claude Code ou no Codex.
> Atualize-o ao terminar uma sessão: o que foi feito, o que ficou pendente e por quê.

Última atualização: 2026-09-22 · Codex · 3.9 concluída no PR draft [#25](https://github.com/johnberks/dokh/pull/25), empilhado sobre o [#24](https://github.com/johnberks/dokh/pull/24). A 3.1 segue pendente da conexão real do app preview.

## Onde paramos

A **Fase 0** e quase toda a **Fase 1** do `build-plan.md` estão implementadas. A **2.1 (tokens)** foi integrada no PR #2. Esta branch empilha os PRs draft #3 (fontes da 2.2), #4 (primitives da 2.3), #5 (navegação da 2.4), #6 (estados técnicos da 2.6), #7 (Review Card), #8 (Card de Trabalho), #9 (ReceivableRow), #10 (EmptyState), #11 (ProgressCard), #12 (MoneyInput), #13 (WorkTypeSelector), #14 (CalendarGrid), #15 (BottomSheet) e #16 (PremiumGate). Todos estão em rascunho, cada um baseado no anterior, e todos com CI verde. As quatro telas ainda são placeholders: seus headers e conteúdos próprios serão montados nas tarefas de tela, sempre com HTML e UX correspondentes. A 2.2 ainda depende do SVG D1 final e de splash em build nativo; a 2.3, a 2.4, a 2.5 e a 2.6 ainda dependem de inspeção visual/VoiceOver em device, sem bloquear trabalho independente. O usuário dispensou sua validação para prosseguir e adiou a validação Android para um segundo momento. A **1.9 (EAS)** continua dependendo de conta Expo.

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
| 2.5 Componentes de domínio visual | 🟡 Review Card no PR draft #7, Trabalho no #8, ReceivableRow no #9, EmptyState no #10, ProgressCard no #11, MoneyInput no #12, WorkTypeSelector no #13, CalendarGrid no #14, BottomSheet no #15 e PremiumGate no #16 — os 10 componentes existem | Aplicação nas telas reais e inspeção em aparelho |
| 2.6 Estados técnicos | 🟡 Componentes e catálogo no PR draft #6 | Inspeção visual, VoiceOver no iPhone e Android/TalkBack depois |
| 3.1 Supabase local/remoto | 🟡 Start/reset local passaram; `dokh-preview` e `dokh-production` ativos em `johnberks's Org` Free; chaves públicas isoladas | Configurar EAS/cliente e comprovar conexão real do app preview somente ao projeto preview |
| 3.2 Perfis e preferências | ✅ Migration, constraints, RLS, rollback descartável e tipos testados | — |
| 3.3 Núcleo profissional | ✅ Cinco tabelas, constraints, FKs por dono, índices, RLS, rollback e tipos testados | — |
| 3.4 Suporte operacional | ✅ Quatro tabelas, idempotência por evento/arquivo/linha, FKs, RLS, rollback e tipos testados | — |
| 3.5 RLS completa | ✅ Matriz automatizada das 12 tabelas, privilégios mínimos, `service_role` e guard de views | — |
| 3.6 Storage privado | ✅ Buckets, paths por usuário, policies e testes de upload/download/exclusão/URL assinada | — |
| 3.7 RPCs Trabalho + Recebível | ✅ Criar, editar e excluir atomicamente com JWT, idempotência e rollback testados | — |
| 3.8 Confirmação de Recebível | ✅ RPC explícita, horário de servidor imutável, ownership e concorrência testados | — |
| 3.9 Residência recorrente Free | ✅ RPCs de criação/edição/desativação, geração mensal e job de extensão; histórico e limites testados | — |

## Como rodar o projeto

```bash
cd <raiz do seu checkout>      # ex.: ~/Desktop/dokh
fnm exec --using=22 node -v   # Node 22 (.nvmrc)
cp .env.example .env.local   # se ainda não existir
fnm exec --using=22 npm ci
fnm exec --using=22 npm run start -- --clear  # QR code para o Expo Go
```

Até configurar a chave pública local, o `.env.local` pode usar valores provisórios apenas para abrir as telas sem backend:

```text
EXPO_PUBLIC_APP_ENV=local
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=replace-after-supabase-start
```

O Docker já está operacional: siga [`docs/supabase-local.md`](supabase-local.md) e substitua pelos valores reais de `npm run supabase:status`. Para preview/production, os refs públicos foram fixados no código; configure a URL e a chave publishable do projeto correto. O arquivo local ignorado `supabase/.env.local` guarda as credenciais remotas nesta worktree, sem enviá-las ao Git.

## Retomada

O ponto de retomada desta trilha é o PR draft [#25](https://github.com/johnberks/dokh/pull/25), branch `codex/3.9-residency-free`, empilhado sobre o [#24](https://github.com/johnberks/dokh/pull/24). A 3.9 está concluída. A 3.1 está **parcial**: configuração e testes de ambiente prontos, mas sem prova da DoD. Na base, **todos os componentes da 2.5 existem**; a 2.5 continua desmarcada até aplicação nas telas reais e validação em aparelho.

Ordem de integração em `main`: #3 → #4 → #5 → #6 → #8 → #9 → #10 → #11 → #12 → #13 → #14 → #15 → #16 → #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25. Cada um usa o anterior como base e nenhum chegou à `main`. O #7 (Review Card) já foi mesclado na branch do #6, então entra junto com ele.

Próximo passo de infraestrutura com dependências satisfeitas: **3.11**, views/funções de projeção de Agenda, Home e Finanças. A 3.10 depende antes da 5.4 (espelho de entitlement Premium). A 3.5 não cria views, mas impede por teste que views públicas futuras sejam definer ou que materialized views sejam legíveis pelo cliente. Para a 3.1, ainda falta comprovar a conexão **do app preview** ao projeto `dokh-preview`, após configurar EAS (1.9) e cliente/sessão (4.1). Trabalho independente: **2.7 motion e reduzir movimento**.

Na 3.9, `create_or_update_residency`, `generate_residency_receivables` e `deactivate_residency` fazem o agregado Free sem `work_series` ou consulta a entitlement. O primeiro cadastro gera do mês inicial ao término ou à janela atual + 12 meses; o dia 31 é limitado ao último dia válido. Edição/desativação afetam apenas Recebíveis futuros não recebidos; históricos confirmados permanecem. Um job privado diário do Supabase Cron estende a janela sem depender do app aberto. Testes SQL em banco descartável e PostgREST local cobriram fevereiro bissexto/comum, concorrência, idempotência, ownership, rollback, worker e zero linhas em `work_series`. O job foi verificado no banco local principal; nenhuma migration foi aplicada em preview/production e não houve reset local. Tipos públicos foram regenerados. `npm run test:db`, `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. HTMLs e UX de Onboarding, Perfil, Home e Finanças foram consultados; não houve mudança de UI. Contrato em [`residency-recurrence.md`](residency-recurrence.md).

Na 3.8, `confirm_receivable_received` confirma apenas por ação explícita do dono, sob lock de linha, com `received_at` do relógio do servidor. Chamadas repetidas ou concorrentes devolvem o primeiro horário sem nova gravação. Uma trigger impede reescrever ou limpar um horário já confirmado; Recebível invalidado e outro usuário são negados. O teste SQL em banco descartável cobriu ausência de confirmação automática, ownership, auditoria, repetição, permissões e rollback. O teste PostgREST local cobriu concorrência, leitura persistida e rejeição cruzada/anônima. A migration foi aplicada somente no Supabase local, sem reset nem alteração em preview/production. Tipos públicos foram regenerados. `npm run test:db`, `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. HTMLs e UX de Agenda/Finanças foram consultados, sem mudança de UI. Contrato em [`confirm-receivable.md`](confirm-receivable.md).

Na 3.7, três RPCs `SECURITY DEFINER` com `search_path` vazio fazem CRUD lógico do agregado manual Trabalho + Recebível numa transação, derivando o dono de `auth.uid()`. A tabela privada de idempotência tem RLS e chave por usuário; não concede escrita direta de domínio ao app. O teste SQL cobre anônimo, sessão sem sujeito, outro usuário, repetição/colisão de chave, rollback da primeira tabela se a segunda falhar, coerência de competência/valor/previsão e exclusão dos dois lados. Um teste PostgREST local cobriu chamadas concorrentes com a mesma chave, parâmetros nulos e bloqueio cruzado. Migration/rollback passaram em banco descartável; a migration foi aplicada apenas no Supabase local. Tipos públicos foram regenerados. `npm run test:db`, `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. HTMLs e UX de Agenda/Finanças foram consultados, sem alteração de UI. Contrato e limites em [`work-aggregate-rpcs.md`](work-aggregate-rpcs.md).

Na 3.6, `avatars` e `imports` foram criados como buckets privados com limite de 10 MiB, MIME permitido e policies de `storage.objects` por primeira pasta igual a `auth.uid()`. O teste da API Storage local usou duas contas descartáveis e comprovou upload/download/delete do dono, bloqueio de outro usuário e anônimo, ausência de URL pública, MIME negado, recusa de overwrite, expiração da URL assinada e indisponibilidade após excluir o objeto. `npm run test:db`, `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. O primeiro Jest em paralelo teve um timeout isolado em rotas; a repetição isolada e a suíte completa sequencial passaram. A migration foi aplicada **somente no Supabase local**, sem reset nem alteração em preview/production. Não houve mudança de UI ou tipos públicos; HTML/UX de Perfil foram consultados. Contrato e pendências em [`private-storage.md`](private-storage.md).

Na 3.5, a auditoria encontrou privilégios herdados de `TRUNCATE`, `REFERENCES`, `TRIGGER` e `MAINTAIN` em perfis/preferências; a migration os removeu e padronizou grants mínimos das 12 tabelas. `service_role` agora tem CRUD explícito para Edge Functions, mas segue proibido no app. `supabase/tests/3_5_rls_matrix.sql` comprova anônimo, dono, outra conta e service role em **cada** tabela, além de escrita cruzada negada, grants padrão futuros restritos e guard de views. `npm run test:db`, `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. Não houve mudança de tipos nem UI; a migration foi aplicada somente no Supabase local, sem reset ou alteração remota. Detalhes em [`rls.md`](rls.md).

Na 3.4, `subscription_entitlements`, `device_push_tokens`, `imports` e `import_issues` receberam enums, constraints, índices e RLS. O espelho Premium e o preview de importação são leitura do dono e escrita exclusiva do servidor; tokens push permitem CRUD apenas do dono. `imports` deduplica por `(user_id, file_sha256)` e `work_entries` por `(import_id, import_row_key)`, com FK composta por dono. O preview e as pendências não criam Trabalhos. `npm run test:db` passou para 3.2–3.4 em bancos descartáveis, incluindo rollback; `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. A migration foi aplicada **somente no Supabase local**, sem reset nem alteração em preview/production. Os HTMLs/UX de Perfil foram consultados, sem mudança visual nesta tarefa.

Na 3.3, as cinco tabelas do núcleo profissional foram criadas com enums, checks de Plantão, XOR/unicidades de Recebível, FKs compostas por dono e índices de Agenda/caixa/competência. `npm run test:db` valida 3.2 e 3.3 em bancos descartáveis, incluindo rollback, acesso do dono/outro usuário/anônimo e bloqueio de escrita direta. `npm run check:db-types`, `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. A migration foi aplicada somente no Supabase local, sem reset; preview/production não foram alterados. Escritas do app continuam fechadas até as RPCs atômicas e gates Premium posteriores. Detalhes em [`supabase-local.md`](supabase-local.md).

Na 3.2, `supabase/migrations/20260922000000_profiles_preferences.sql` criou as três tabelas, enum, validação de zona IANA, trigger de `updated_at` e policies por `auth.uid()`. `profiles.user_id` é gerado a partir de `id = auth.users.id`; não deve ser enviado pelo cliente, embora o gerador da CLI ainda o liste como campo opcional em `Insert`/`Update`. Quatro toggles de notificação começam em `false` até a pessoa optar por ativá-los. `npm run test:db` comprovou up/down em banco temporário, constraints e isolamento dono/outro usuário/anônimo; `npm run check:db-types` bateu com o schema local. `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes/147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram. Nada foi aplicado em preview/production. O CI agora repete testes SQL e paridade de tipos.

Nesta branch, a CLI 2.113.0 foi fixada como devDependency; `supabase/config.toml` e os scripts locais foram criados. Os refs públicos remotos estão versionados no schema, que recusa preview→production e URL local. `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes, 147 testes), `npm run check:agents` e `npx expo-doctor` (21/21) passaram com Node 22. Em 2026-09-22, após o usuário liberar a porta 54322, os contêineres DOKH ficaram saudáveis, `npm run supabase:status` e `npm run supabase:reset` passaram, e `/auth/v1/health` respondeu HTTP 200. Os projetos remotos `dokh-preview` (`lakpndtdkcjtazoybgnv`) e `dokh-production` (`irdsieciowovsaakikbf`) foram criados na organização pessoal Free, região `sa-east-1`, sem upgrade. Cada chave publishable acessou o próprio endpoint REST e foi rejeitada (`401`) no projeto oposto. O checkbox 3.1 permanece desmarcado apenas pela prova de conexão do app preview.

```bash
git fetch origin codex/3.7-work-rpcs
git switch -c codex/3.7-work-rpcs origin/codex/3.7-work-rpcs
fnm exec --using=22 npm ci
fnm exec --using=22 npm run typecheck && fnm exec --using=22 npm run check && fnm exec --using=22 npm test -- --runInBand
```

**Teste manual:** o usuário testa no **Expo Go no iPhone**, não no simulador. Ao final de cada entrega, forneça um bloco bash que faça checkout da branch e rode `npx expo start --clear`, dizendo o que conferir (ex.: catálogo em `/dev/primitives`).

## Como continuar no Codex

1. Abrir o Codex na raiz do repositório: ele lê `AGENTS.md` automaticamente (cópia idêntica de `CLAUDE.md`, gerada por `npm run sync:agents`).
2. Pedir uma tarefa identificada do `build-plan.md`. Modelo de pedido:

```text
Leia docs/HANDOFF.md e AGENTS.md. Retome a tarefa 3.1 do build-plan.md
na branch codex/3.1-supabase-local. Docker e os projetos Supabase remotos
já foram validados; falta comprovar que o app preview conecta somente a
`dokh-preview`, após 1.9/4.1. Rode typecheck, check e test. Marque o
checkbox somente se toda a DoD passar e atualize este handoff e o PR #17.
```

3. Ao terminar: atualizar este arquivo, enviar a branch e abrir o PR em rascunho sobre o anterior.

### Cuidados nesta máquina

- O Codex trabalha em **worktrees** próprias (`~/Documents/Codex/.../work/dokh-*`). Uma branch já aberta em uma worktree não pode ser usada em outra: crie a nova branch a partir de `origin/<branch>`.
- O `fnm` não está no perfil do shell. Use `fnm exec --using=22 <comando>` ou `eval "$(fnm env --use-on-cd --shell zsh)"` antes.
- Instalar biblioteca Expo/nativa com `npx expo install`; bibliotecas puramente JS com `npm install`.
- Um único Metro por vez: `lsof -ti tcp:8081 | xargs kill` antes de subir outro.

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
- **Card de Trabalho (2.5 parcial)**: layouts Agenda, Home em destaque e linha compacta a partir dos HTMLs e UX. Cor é token validado de Local, horário é opcional para tipos que permitem e “Recebido” só vem de confirmação derivada do Recebível. `docs/work-card.md` documenta a divergência sem badge e os limites; o catálogo interno demonstra os estados.
- **ReceivableRow (2.5 parcial)**: linha de Entradas recebida, prevista e com confirmação pendente a partir de Finanças 05–10. A confirmação é callback separado, sem alteração otimista; `docs/receivable-row.md` detalha medidas e limites.
- **EmptyState (2.5 parcial)**: nove posições de dados legitimamente vazios em Home, Agenda, Finanças/Entradas e Perfil. Não substitui `LoadError`; `docs/empty-state.md` especifica variações, medidas e limites. O catálogo interno permite inspeção.
- **ProgressCard (2.5 parcial)**: card inicial da Home com barra proporcional, marcos concluídos e próxima ação; desaparece quando completo. Não presume residência nem conclui marcos sozinho. `docs/progress-card.md` especifica as medidas e o contrato; o catálogo demonstra as três variações HTML.
- **PremiumGate e PremiumBadge (2.5 parcial)**: folha Free de Agenda 12/14 na ordem valor → explicação → oferta, com prévia real esmaecida, CTA para o fluxo de benefícios (nunca direto à compra) e saída Free obrigatória; o gate não consulta plano. Selo reutilizável nos cartões de Finanças. Detalhes em `docs/premium-gate.md`.
- **BottomSheet (2.5 parcial)**: variações `standard` (Agenda 08–14, Finanças) e `menu` (Agenda 06B), controlado pela tela, fecha por fundo/alça/arraste/voltar do Android/escape do VoiceOver, respeita reduzir movimento (`src/theme/useReducedMotion.ts`). Detalhes em `docs/bottom-sheet.md`.
- **CalendarGrid (2.5 parcial)**: grade de Agenda 01–05 e do sheet de data 08 com hoje (contorno bronze), selecionado (círculo verde escuro), passado (cinza-verde) e pontos por Trabalho na cor do Local; início Domingo/Segunda (D39). Lógica pura em `src/domain/calendar.ts` com `date-fns`. Detalhes em `docs/calendar-grid.md`.
- **WorkTypeSelector (2.5 parcial)**: `choice` (Onboarding 06, rádio com check bronze) e `menu` (Agenda 06B, ação com chevron) para Plantão, Procedimento e Atendimento; área inteira clicável, seleção anunciada e marcada por borda/check. `src/domain/work-type.ts` define os tipos e `requiresSchedule`. Detalhes em `docs/work-type-selector.md`.
- **MoneyInput (2.5 parcial)**: campo compacto da Agenda e números grandes do Onboarding, com rascunho textual controlado; `src/domain/money.ts` converte pt-BR em centavos `bigint` só na validação/envio. `docs/money-input.md` registra o contrato e o catálogo mostra quatro tratamentos dos HTMLs.

## Armadilhas já encontradas

- Instalar libs Expo/nativas com `npx expo install`. O `npm install` direto puxou `react-dom` incompatível.
- `npx expo install ... -- --save-dev` colocou pacotes de teste em `dependencies`; conferir o `package.json`.
- RNTL 14: `render` e `fireEvent` são assíncronos. Sempre `await`.
- `renderRouter` não aguarda o render; usar o helper `openAt` de `src/test/routes.test.tsx`.
- QueryClient de teste precisa de `gcTime: Infinity` em queries e mutations, senão o Jest não encerra.
- Não usar `new URL().hostname` no app: a implementação de URL do React Native é incompleta.
- `lucide-react-native` é mapeado para o build CJS só no Jest (`package.json` > `jest.moduleNameMapper`).
- Reanimated 4 no Jest: `src/test/native-mocks.setup.ts` mocka `react-native-worklets` e chama `setUpTests()`. Os testes de rota usam o mock do Expo Router, que **não tem** `useReducedMotion`; use o hook próprio `src/theme/useReducedMotion.ts`.
- Use `useContext(SafeAreaInsetsContext)` com fallback em componentes que também aparecem em testes sem `SafeAreaProvider`.
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
- O HTML original usa rótulos pequenos em sálvia/bronze com contraste calculado de cerca de 3,35–3,43:1; foram mantidos literalmente a pedido do usuário. Confirmar a legibilidade no iPhone antes de fechar a validação visual.
- O card de Trabalho cobre Agenda 02/03/05 e Home 01/03, com barra lateral do Local e estados financeiros explícitos; `Agenda 05` difere do UX ao desenhar uma cápsula para `Recebido`, por isso a UI segue o UX com check e texto sem badge.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (14 suítes, 63 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. A 2.5 ainda tem oito componentes sem implementação e não foi marcada como concluída.
- PR draft #8 usa #7 como base temporária; ordem de integração #3 → #4 → #5 → #6 → #7 → #8. O checkout desta branch é a prévia mais recente; não mesclar diretamente em `main`.
- `ReceivableRow` reproduz os itens de Entradas 05–10 nos estados recebido, previsto e confirmação pendente. O estado vem do Recebível; a ação de confirmar não altera o item localmente e fica bloqueada quando `confirming` é verdadeiro. O catálogo mostra os três estados; sem persistência, resumo mensal ou extrato completo neste recorte.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (15 suítes, 69 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. A 2.5 ainda tem sete componentes sem implementação e segue desmarcada.
- PR draft #9 usa #8 como base; seguir a ordem #3 → #4 → #5 → #6 → #7 → #8 → #9. Esta branch é a prévia mais recente para Expo Go, mas o catálogo não substitui a integração nas telas reais.
- `EmptyState` cobre Home 05/06, Agenda 04, Finanças 11/14 e `Nenhuma prevista`, Perfil 03b/05b/12c, sem ilustrar ou inventar `R$ 0`. Callbacks e rótulo de mês vêm da tela; erros usam os estados técnicos.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (16 suítes, 78 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22 após o ajuste de altura mínima para Dynamic Type. A 2.5 segue desmarcada.
- PR draft #10 usa #9 como base temporária; seguir a ordem #3 → #4 → #5 → #6 → #7 → #8 → #9 → #10. Este checkout é a prévia mais recente no Expo Go, sem ainda apresentar estes estados nas telas reais.
- `ProgressCard` cobre Home 01/02/06 com superfície `#DCE0D6`, barra proporcional, lista de marcos e ação de destino acessível. Conclusão e elegibilidade são fornecidas pela feature; o card inteiro some quando completo. O catálogo mostra as três próximas ações do HTML, mas ainda não há integração na Home real.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (17 suítes, 83 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. A 2.5 segue desmarcada, com cinco componentes restantes.
- PR draft #11 usa #10 como base temporária; seguir a ordem #3 → #4 → #5 → #6 → #7 → #8 → #9 → #10 → #11. Este checkout é a prévia mais recente no Expo Go; os estados do catálogo não substituem a integração nas telas reais.
- `MoneyInput` cobre o campo vazio/preenchido da Agenda 06/09 e as entradas grandes de Residência e primeiro Trabalho do Onboarding. A revisão de boas práticas React manteve o campo controlado e sem efeito para estado derivado. O parser só produz centavos `bigint` positivos e rejeita formatos ambíguos/overflow; nenhuma feature grava esses valores ainda.
- `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (19 suítes, 106 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. `simctl` novamente falhou ao conectar ao CoreSimulatorService; inspeção visual/VoiceOver no iPhone e Android/TalkBack continuam pendentes. A 2.5 segue desmarcada, com quatro componentes restantes.
- PR draft #12 usa #11 como base temporária; seguir a ordem #3 → #4 → #5 → #6 → #7 → #8 → #9 → #10 → #11 → #12. Este checkout é a prévia mais recente no Expo Go; o catálogo não substitui a integração nas telas reais.
- Após o ajuste final de formatação no commit `2a27836`, a CI do PR #12 passou (typecheck, Biome e Jest). O CoreSimulatorService segue indisponível neste ambiente, portanto o catálogo precisa ser conferido no iPhone 16 pelo Expo Go quando possível.

- `WorkTypeSelector` cobre Onboarding 06 (escolha) e Agenda 06B (menu), com ícones pelos paths exatos do HTML e descrições distintas de cada tela. `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (21 suítes, 116 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. Sem teste em simulador, a pedido do usuário; a conferência visual fica no Expo Go do iPhone. A 2.5 segue desmarcada, com três componentes restantes.

- `CalendarGrid` cobre Agenda 01–05 e 08. `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (23 suítes, 130 testes; calendário também em fusos −11 h, −3 h e +14 h), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. A 2.5 segue desmarcada, com dois componentes restantes.

- `BottomSheet` cobre Agenda 06B/08–14 e as folhas de Finanças. `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (25 suítes, 138 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. Arraste e voltar do Android não são exercitados no Jest; conferir no aparelho. A 2.5 segue desmarcada, com o PremiumGate restante.

- `PremiumGate` cobre Agenda 12 e 14; `PremiumBadge` serve também a Finanças. `npm run typecheck`, `npm run check`, `npm test -- --runInBand` (26 suítes, 145 testes), `npm run check:agents`, `npx expo-doctor` (21/21) e `npx expo export --platform ios` passaram com Node 22. Com ele, os dez componentes da 2.5 existem; a tarefa segue desmarcada até integração em telas e validação em aparelho.

## Pendências humanas (bloqueiam só o trecho relacionado)

- Android SDK/emulador ou celular Android com Expo Go (fecha 1.1 e 1.3).
- Validação Android/TalkBack da 2.3 adiada a pedido do usuário; não substitui a DoD original.
- Proteção da `main` no GitHub (fecha 0.3 e 1.8).
- Conta Expo/EAS (1.9) e integração cliente/sessão (4.1) para provar app preview em `dokh-preview` (3.1). Docker local foi reparado pelo usuário e start/reset validados em 2026-09-22. Os dois projetos DOKH foram criados no Free, sem alterar projetos alheios.
- P01 preços, P02 arquivos do Plantãozinho, P03 recorrência custom, P04 textos legais, P05 confirmações destrutivas.

## Próximas tarefas sugeridas (em ordem)

1. **2.2** Finalizar o símbolo D1 e splash a partir do vetor final aprovado; fontes já estão no PR draft #3.
2. **3.4–3.5** Migrations e RLS sobre Supabase local; projetos remotos disponíveis. Não aplicar migration remota sem testes de propriedade/RLS.
3. **1.9 + 4.1** EAS e cliente/sessão; comprovar app preview em `dokh-preview` para fechar a 3.1. Depois **4.2/4.5** e telas. **2.7** motion pode entrar independentemente.
