# Build plan — DOKH MVP

## Regras de execução

- Executar em ordem de dependências, não apenas pela numeração.
- Uma tarefa bloqueada não impede outras sem a mesma dependência.
- Cada tarefa deve ser pequena o suficiente para um PR verificável.
- Marcar `[x]` somente após executar a Definition of Done (DoD).
- Registrar evidência objetiva no PR: comandos, testes, screenshots ou links de console.
- Tarefas com ação em console externo podem exigir etapa humana; o agente prepara e documenta, mas não inventa credenciais, produtos ou preços.
- Antes de UI: ler UX + HTML da seção.
- Antes de dados: ler `decisions.md` + `domain-model.md`.
- Residência recorrente é Free; recorrência de Trabalho é Premium.

## DoD global para qualquer tarefa

- TypeScript sem erro.
- Biome sem erro nos arquivos alterados.
- Testes proporcionais ao risco passando.
- Nenhum secret ou PII em código/log.
- Acessibilidade básica quando houver UI.
- Documentação atualizada quando contrato, schema ou decisão mudar.
- Nenhuma alteração fora do escopo.

---

## Fase 0 — Base documental e repositório

- [x] **0.1 — Normalizar fontes do produto**
  - Dependências: nenhuma.
  - Criar `docs/screens/` e `design/`.
  - Posicionar os cinco UX docs com nomes normalizados.
  - Posicionar os cinco HTMLs de tela e os HTMLs de Brand Kit/Componentes como somente leitura.
  - Não alterar conteúdo durante a movimentação.
  - **DoD:** todos os caminhos citados no README existem; hashes dos arquivos de origem e destino confirmam cópia íntegra.
  - Evidência: hashes em docs/SOURCES.md (PR #1).

- [ ] **0.2 — Tornar instruções compatíveis com Codex**
  - Dependências: 0.1.
  - Criar `AGENTS.md` apontando para `CLAUDE.md` ou com conteúdo idêntico.
  - Definir `CLAUDE.md` como canônico para humanos e manter regra de sincronização explícita.
  - **DoD:** uma sessão Codex iniciada na raiz identifica as instruções; não há regras conflitantes entre os dois arquivos.

- [ ] **0.3 — Configurar Git e proteção de branch**
  - Dependências: nenhuma.
  - Inicializar/conectar repositório, `.gitignore`, branch `main` protegida e template de PR com seção de DoD.
  - **DoD:** PR é obrigatório para `main`; checks poderão ser exigidos após 1.8.

---

## Fase 1 — Fundação Expo

- [ ] **1.1 — Criar aplicação Expo TypeScript**
  - Dependências: 0.3.
  - Bootstrap sem template demonstrativo desnecessário.
  - Usar npm e versionar `package-lock.json`.
  - Habilitar `strict: true`.
  - **DoD:** development build abre uma tela mínima em simulador iOS e emulador Android.

- [x] **1.2 — Criar estrutura de pastas e aliases**
  - Dependências: 1.1.
  - Implementar estrutura do README e alias `@/` para `src/`.
  - Adicionar regras de dependência por convenção/documentação.
  - **DoD:** import com alias funciona em app, Jest e TypeScript; não há cálculo de domínio dentro de `app/`.
  - Evidência: alias em TS, Jest e Metro; regras de camada no Biome (PR #1).

- [ ] **1.3 — Configurar Expo Router e shells de rota**
  - Dependências: 1.1.
  - Criar grupos `(auth)`, `(onboarding)` e `(tabs)`.
  - Criar placeholders para Home, Agenda, Finanças e Perfil e ação central sem rota-tab.
  - **DoD:** navegação, back do Android e deep link de teste funcionam em iOS/Android.

- [x] **1.4 — Configurar ambientes e validação de env**
  - Dependências: 1.1.
  - Criar `.env.example` sem valores.
  - Validar variáveis públicas com schema no startup.
  - Separar local, preview e production.
  - **DoD:** app falha com mensagem de desenvolvimento clara quando variável obrigatória falta; secrets não entram no bundle.
  - Evidência: erro claro no Expo Go sem .env.local; testes de schema e de secrets (PR #1).

- [x] **1.5 — Configurar i18n pt-BR**
  - Dependências: 1.1.
  - Instalar/configurar i18next.
  - Separar chaves por feature.
  - **DoD:** placeholders usam chaves; teste garante fallback e ausência de texto crítico hardcoded.
  - Evidência: testes de fallback e guarda de texto hardcoded (PR #1).

- [x] **1.6 — Configurar estado e formulários**
  - Dependências: 1.1.
  - TanStack Query sem persistência.
  - Zustand para UI transitória.
  - React Hook Form + Zod.
  - **DoD:** formulário de prova valida, submete e preserva dados em erro; inspeção confirma ausência de cache persistido.
  - Evidência: formulário de prova + guardas de persistência (PR #1).

- [x] **1.7 — Configurar qualidade local**
  - Dependências: 1.1.
  - Biome, typecheck, Jest/jest-expo e React Native Testing Library.
  - Scripts: `typecheck`, `check`, `test`, `test:watch`.
  - **DoD:** todos os scripts passam em checkout limpo; não há ESLint/Prettier paralelos.
  - Evidência: scripts verdes em clone limpo (PR #1).

- [ ] **1.8 — Configurar CI**
  - Dependências: 1.7.
  - GitHub Actions para install com lockfile, typecheck, Biome e Jest.
  - Cache seguro de dependências.
  - **DoD:** PR de teste executa checks; falha intencional bloqueia merge.

- [ ] **1.9 — Configurar EAS**
  - Dependências: 1.1, 1.4.
  - `eas.json`, development/preview/production, runtime version e canais OTA.
  - **DoD:** development build de iOS e Android é gerado; update compatível chega ao canal preview.

---

## Fase 2 — Design system e infraestrutura visual

- [x] **2.1 — Extrair tokens do Brand Kit**
  - Dependências: 1.2.
  - Cores, tipografia, spacing, radius, shadow, motion e z-index.
  - Tokens semânticos além dos valores brutos.
  - **DoD:** nenhum componente de demonstração usa hexadecimal ou família de fonte fora dos tokens.

- [ ] **2.2 — Configurar fontes e assets da marca**
  - Dependências: 2.1.
  - Archivo, IBM Plex Mono, Unbounded e símbolo vetorial aprovado.
  - Splash nativo consistente com design.
  - **DoD:** fontes carregam sem layout quebrado; fallback testado; símbolo renderiza nos tamanhos mínimos.

- [ ] **2.3 — Criar primitives acessíveis**
  - Dependências: 2.1.
  - Text, Button, IconButton, Input, SegmentedControl, Toggle, Chip, Divider, Card, Screen e ScrollScreen.
  - **DoD:** catálogo interno demonstra estados normal/desabilitado/loading/erro e labels de acessibilidade.

- [ ] **2.4 — Criar navegação visual compartilhada**
  - Dependências: 1.3, 2.3.
  - Status bar, safe areas, headers, back button, bottom tabs e botão central.
  - **DoD:** 390×844 e devices com notch/Dynamic Island/Android não cortam conteúdo; alvo mínimo 44×44.

- [ ] **2.5 — Criar componentes de domínio visual**
  - Dependências: 2.3.
  - ReviewCard, WorkCard, ReceivableRow, EmptyState, ProgressCard, MoneyInput, WorkTypeSelector, CalendarGrid, BottomSheet e PremiumGate.
  - **DoD:** variações previstas nos HTMLs são reproduzidas em catálogo e testadas; Review Card respeita limite de previews/atenção.

- [ ] **2.6 — Criar estados técnicos compartilhados**
  - Dependências: 2.3.
  - Skeleton, LoadError, MutationError e OfflineBanner.
  - **DoD:** erro nunca renderiza EmptyState; retry é acessível; skeleton não mostra valores falsos.

- [ ] **2.7 — Configurar motion e reduce motion**
  - Dependências: 2.3.
  - Reanimated e helpers padronizados.
  - **DoD:** carrossel e remoção de card têm demonstração; reduce motion remove/reduz transições sem quebrar navegação.

---

## Fase 3 — Supabase, schema e segurança

- [ ] **3.1 — Inicializar Supabase local e ambientes remotos**
  - Dependências: 1.4.
  - Supabase CLI, config local e projetos separados preview/production.
  - **DoD:** `supabase start` e reset local funcionam; app preview conecta somente ao projeto preview.

- [x] **3.2 — Migration de perfis e preferências**
  - Dependências: 3.1.
  - `profiles`, `work_preferences`, `notification_preferences`, enums e trigger `updated_at`.
  - **DoD:** constraints do `domain-model.md` passam; migration sobe e desce em banco descartável.

- [x] **3.3 — Migration do núcleo profissional**
  - Dependências: 3.1.
  - `work_locations`, `work_series`, `work_entries`, `residencies`, `receivables` e índices.
  - **DoD:** XOR de origem do Recebível, unicidades, checks de Plantão e índices por usuário/data validados em testes SQL.

- [ ] **3.4 — Migration de suporte operacional**
  - Dependências: 3.1.
  - `subscription_entitlements`, `device_push_tokens`, `imports`, `import_issues`.
  - **DoD:** idempotência/uniqueness definida; nenhum payload vira fonte de verdade de Trabalho.

- [ ] **3.5 — Configurar RLS completa**
  - Dependências: 3.2, 3.3, 3.4.
  - Policies por ownership e acesso de Edge Functions.
  - Views com segurança correta.
  - **DoD:** testes automatizados cobrem anônimo, dono e outro usuário em cada tabela; acesso cruzado falha.

- [ ] **3.6 — Configurar Storage privado**
  - Dependências: 3.5.
  - Buckets de avatar e imports, paths por usuário, upload/download/delete.
  - **DoD:** outro usuário e anônimo não acessam; URL assinada expira; exclusão remove objeto.

- [ ] **3.7 — Implementar RPCs do agregado Trabalho**
  - Dependências: 3.3, 3.5.
  - Criar, editar e excluir Trabalho + Recebível atomicamente.
  - Usar usuário do JWT e idempotency key.
  - **DoD:** testes provam atomicidade, ownership, idempotência e atualização coerente das duas entidades.

- [ ] **3.8 — Implementar confirmação de Recebível**
  - Dependências: 3.3, 3.5.
  - RPC explícita para confirmar recebido; não aceitar confirmação automática.
  - **DoD:** repetir chamada não duplica/avança estado; outro usuário não confirma; data registrada é auditável.

- [ ] **3.9 — Implementar Residência recorrente Free**
  - Dependências: 3.3, 3.5.
  - Criar/editar/desativar Residência e gerar Recebíveis mensais.
  - Não consultar entitlement e não criar `work_series`.
  - Reconciliar somente futuros não recebidos.
  - **DoD:** usuário Free gera meses corretamente, inclusive dia 31/fevereiro; recebidos históricos não mudam; teste garante zero linhas em `work_series`.

- [ ] **3.10 — Implementar recorrência de Trabalho Premium**
  - Dependências: 3.3, 3.5, 5.4.
  - Materialização idempotente por 12 meses e extensão periódica.
  - Validar entitlement no servidor.
  - **DoD:** Free é negado sem estado parcial; Premium gera Trabalho + Recebível sem duplicação; weekly/biweekly/monthly testados.

- [ ] **3.11 — Criar views/funções de projeção**
  - Dependências: 3.3, 3.8, 3.9.
  - Agenda por dia, status derivado, mês financeiro, origem, competência, valor/hora e ano.
  - **DoD:** fixtures cobrem caixa versus competência, sem data, confirmação pendente, residência, primeiro mês e virada do ano.

- [ ] **3.12 — Gerar tipos e seed de desenvolvimento**
  - Dependências: 3.11.
  - Script `generate:types`, fixtures sem PII e usuários de teste.
  - **DoD:** tipos versionados compilam; seed reproduz estados principais dos designs.

---

## Fase 4 — Autenticação e conta

- [ ] **4.1 — Integrar Supabase client e sessão segura**
  - Dependências: 1.4, 3.1.
  - SecureStore adapter, refresh e limpeza no logout.
  - **DoD:** sessão sobrevive reinício; token não aparece em AsyncStorage/log; logout limpa e redireciona.

- [ ] **4.2 — Implementar e-mail/senha e recuperação**
  - Dependências: 4.1.
  - Sign up, sign in, deep link de reset e mensagens técnicas compartilhadas.
  - **DoD:** conta de teste completa cadastro, login, logout e reset em iOS/Android.

- [ ] **4.3 — Implementar Apple Sign In**
  - Dependências: 4.1, configuração Apple humana.
  - **DoD:** login real em device iOS retorna sessão Supabase e perfil é criado idempotentemente.

- [ ] **4.4 — Implementar Google Sign In**
  - Dependências: 4.1, configuração Google humana.
  - **DoD:** login real em iOS/Android retorna a mesma conta esperada e sessão válida.

- [ ] **4.5 — Implementar guards de sessão/onboarding**
  - Dependências: 4.1, 3.2.
  - Redirect sem flicker: auth → onboarding incompleto → tabs.
  - **DoD:** matriz de três estados navega corretamente ao abrir app e ao sair/entrar.

- [ ] **4.6 — Implementar exclusão de conta**
  - Dependências: 3.6, 4.1.
  - Edge Function idempotente para dados, Storage e Auth.
  - UI final depende de P05.
  - **DoD técnica:** função testada em ambiente preview remove tudo e revoga sessão; logs não contêm PII.

---

## Fase 5 — Billing e entitlement

- [ ] **5.1 — Definir produtos nas lojas**
  - Dependências: P01.
  - Criar mensal/anual em App Store Connect e Google Play.
  - **DoD:** product IDs registrados em documentação segura e disponíveis em sandbox/test track.

- [ ] **5.2 — Configurar RevenueCat**
  - Dependências: 5.1.
  - Projeto, apps, entitlement `premium`, offering e packages.
  - **DoD:** offering retorna preços localizados reais nos dois devices; nenhum preço hardcoded.

- [ ] **5.3 — Integrar SDK e provider de entitlement**
  - Dependências: 5.2, 4.1.
  - Identificar usuário Supabase, logout correto, cache e refresh.
  - **DoD:** alternar usuário não vaza entitlement; compra sandbox atualiza UI.

- [ ] **5.4 — Implementar webhook RevenueCat**
  - Dependências: 3.4, 5.2.
  - Edge Function autenticada, idempotente, atualiza `subscription_entitlements`.
  - **DoD:** compra, renovação, expiração e cancelamento de sandbox refletem no Supabase; replay de evento não duplica.

- [ ] **5.5 — Implementar fluxo de benefícios e paywall**
  - Dependências: 2.5, 5.3, UX/design Perfil, P01.
  - Quatro slides, mensal/anual, compra, restore, termos/privacidade.
  - **DoD:** Free pode fechar; compra e restore funcionam em iOS/Android; assinante vê estado ativo sem venda.

- [ ] **5.6 — Implementar PremiumGate compartilhado**
  - Dependências: 5.3, 5.4.
  - Preview bloqueado, CTA para benefícios e saída Free.
  - **DoD:** recorrência de Trabalho e cor ampliada nunca bloqueiam salvar Trabalho básico; Residência recorrente funciona sem provider Premium.

---

## Fase 6 — Núcleo de Trabalho e Locais

- [ ] **6.1 — Criar camada de dados de Locais**
  - Dependências: 3.12, 1.6.
  - Queries, mutations, schemas e cache keys.
  - **DoD:** criar/editar/arquivar respeita RLS; histórico preserva local arquivado.

- [ ] **6.2 — Criar camada de dados de Trabalho/Recebível**
  - Dependências: 3.7, 3.8, 3.12.
  - Hooks tipados para create/update/delete/detail/confirm.
  - **DoD:** mutations usam RPCs, invalidam Agenda/Home/Finanças e preservam formulário em erro.

- [ ] **6.3 — Implementar seletor de tipo**
  - Dependências: 2.5, UX/design Agenda e Onboarding.
  - Plantão, Procedimento e Atendimento; área inteira clicável.
  - **DoD:** seleção acessível, não depende de cor e retorna tipo tipado.

- [ ] **6.4 — Implementar formulário compartilhado de Trabalho**
  - Dependências: 6.1, 6.2, 6.3.
  - Local, data, horário/duração condicionais, valor e previsão.
  - **DoD:** Plantão exige horário/duração; demais aceitam ausência; dinheiro vira centavos; sem previsão gera `expected_on = null`.

- [ ] **6.5 — Implementar sheets de data, duração e pagamento**
  - Dependências: 6.4, 2.5.
  - Calendário com pontos, stepper e cálculo D30/D60/D90.
  - **DoD:** virada de mês/ano, término no dia seguinte e datas ocupadas cobertos por testes.

- [ ] **6.6 — Implementar reutilização de Trabalho conhecido**
  - Dependências: 6.4.
  - Derivar templates do histórico, sem tabela duplicada.
  - **DoD:** seleção preenche formulário, exige nova data e permite revisão antes de salvar.

- [ ] **6.7 — Implementar detalhe, edição e exclusão técnica**
  - Dependências: 6.2, 6.4.
  - Detalhe e edição completos; exclusão visual final depende de P05.
  - **DoD:** editar reflete em Agenda e Finanças; exclusão remove projeções; confirmação não é inventada se P05 seguir aberta.

---

## Fase 7 — Onboarding

Pré-requisito documental: UX e design de Onboarding presentes.

- [ ] **7.1 — Splash e carrossel**
  - Dependências: 2.2, 2.7, 1.5.
  - Motion do símbolo, três slides, swipe, pular/continuar.
  - **DoD:** fluxo e indicadores correspondem ao design; reduce motion funciona.

- [ ] **7.2 — Tela de criação/login no fluxo**
  - Dependências: 4.2, 4.3, 4.4, 7.1.
  - **DoD:** cada método abre/realiza o fluxo correto; termos e privacidade usam URLs configuradas quando disponíveis.

- [ ] **7.3 — Coleta de perfil e bifurcação de Residência**
  - Dependências: 3.2, 3.9, 4.5.
  - Nome, faz residência, especialidade, valor e dia.
  - **DoD:** Não pula dados de residência; Sim cria Residência e Recebíveis mensais Free sem `work_series`.

- [ ] **7.4 — Primeiro Trabalho**
  - Dependências: 6.4, 6.5, 7.3.
  - **DoD:** campos condicionais por tipo, previsão opcional e gravação atômica funcionam.

- [ ] **7.5 — Conclusão dinâmica e finalização**
  - Dependências: 7.4.
  - Mostrar somente dados cadastrados; marcar onboarding completo.
  - **DoD:** com/sem residência, com/sem duração opcional e com/sem data prevista cobertos.

- [ ] **7.6 — E2E de onboarding**
  - Dependências: 7.5.
  - **DoD:** Maestro passa em iOS/Android para: sem residência, com residência Free e login existente.

---

## Fase 8 — Agenda

Pré-requisito documental: UX e design de Agenda presentes.

- [ ] **8.1 — Implementar query e calendário mensal**
  - Dependências: 3.11, 6.2, 2.5.
  - Hoje, seleção, dias passados, pontos por local e início de semana configurável.
  - **DoD:** mês padrão, um/múltiplos trabalhos, dia livre e recebido correspondem aos estados desenhados.

- [ ] **8.2 — Implementar lista diária e navegação de mês**
  - Dependências: 8.1.
  - Ordenação e cards com status.
  - **DoD:** tocar dia troca lista; tocar card abre detalhe; Agenda não soma valores.

- [ ] **8.3 — Integrar adicionar/reutilizar/criar**
  - Dependências: 6.3, 6.4, 6.6, 8.2.
  - Botão central e CTA da Agenda usam o mesmo fluxo.
  - **DoD:** ambos criam o mesmo agregado sem duplicação.

- [ ] **8.4 — Integrar detalhe e edição**
  - Dependências: 6.7, 8.2.
  - **DoD:** dados, status, recorrência e cor aparecem conforme plano; alterações refletem ao voltar.

- [ ] **8.5 — Implementar recorrência de Trabalho Premium**
  - Dependências: 3.10, 5.6, 8.3, P03 para custom/edição avançada.
  - Weekly, biweekly e monthly; Free vê preview/saída.
  - **DoD:** Premium gera próximas datas; Free continua sem recorrência; Residência não aparece neste fluxo.

- [ ] **8.6 — Implementar cor Premium/automática**
  - Dependências: 5.6, 6.1.
  - **DoD:** Free salva cor automática/básica; Premium salva paleta ampliada; calendário e cards atualizam.

- [ ] **8.7 — E2E Agenda**
  - Dependências: 8.6.
  - **DoD:** Maestro cobre Trabalho único Free, fluxo sem data de pagamento e recorrência Premium em iOS/Android.

---

## Fase 9 — Finanças

Pré-requisito documental: UX e design de Finanças presentes.

- [ ] **9.1 — Criar camada de queries financeiras**
  - Dependências: 3.11, 3.12.
  - Mês, ano, timeline, sem data, origem, competência e valor/hora.
  - **DoD:** contratos tipados e testes com fixtures batem com cálculos do domínio.

- [ ] **9.2 — Implementar visão mensal base Free**
  - Dependências: 9.1, 2.5.
  - Hero, recebido × a receber, próxima entrada, Review Card e navegação.
  - **DoD:** mês completo, sem pendências, tudo recebido, mês anterior, sem trabalhos e somente sem data cobertos.

- [ ] **9.3 — Implementar extrato de Entradas**
  - Dependências: 9.1, 3.8.
  - Atual/passado/futuro/vazio e confirmação inline.
  - **DoD:** recebido, previsto e pendente são distintos; confirmar atualiza resumos sem automático.

- [ ] **9.4 — Implementar folhas explicativas**
  - Dependências: 9.2.
  - Previsto, recebido, a receber, trabalho gerado e valor/hora.
  - **DoD:** textos e exemplos correspondem ao UX; folha Premium encaminha ao fluxo de benefícios.

- [ ] **9.5 — Implementar visão anual Free**
  - Dependências: 9.1.
  - Barras, média quando válida e estruturas Premium bloqueadas.
  - **DoD:** primeiro mês não cria média/tendência; meses sem dado não viram zero.

- [ ] **9.6 — Implementar análises Premium**
  - Dependências: 5.6, 9.1, 9.5.
  - Origem detalhada, valor/hora, evolução, insight e projeção.
  - **DoD:** servidor/cliente negam Free; Premium vê valores reais; base insuficiente não inventa insight.

- [ ] **9.7 — E2E Finanças**
  - Dependências: 9.6.
  - **DoD:** Maestro cobre confirmação, sem data, mês vazio, Free bloqueado, Premium liberado e residência Free.

---

## Fase 10 — Home

Pré-requisito documental: UX e design de Home presentes.

- [ ] **10.1 — Criar query agregada da Home**
  - Dependências: 3.11, 9.1.
  - Um contrato para hero, histórico, próximos itens, pendências e setup.
  - **DoD:** evita waterfall; teste cobre cada estado do UX.

- [ ] **10.2 — Implementar hero e carrossel**
  - Dependências: 10.1, 2.7.
  - **DoD:** histórico aparece só quando válido; altura fixa e motion correspondem ao design; sem histórico usa uma página.

- [ ] **10.3 — Implementar cards e listas**
  - Dependências: 10.1, 2.5.
  - Próximo Trabalho, próximas Entradas, próximos Trabalhos e destinos.
  - **DoD:** estados com/sem próximo Trabalho e mês sem Entradas correspondem ao UX.

- [ ] **10.4 — Implementar pendências e confirmação**
  - Dependências: 3.8, 10.1, 2.5.
  - Entrada hoje, vencida e sem data.
  - **DoD:** no máximo dois Review Cards/um attention; item não duplica em lista; resolvido sai e atualiza Finanças.

- [ ] **10.5 — Implementar progresso inicial**
  - Dependências: 10.1.
  - **DoD:** aparece apenas incompleto, próxima ação navega certo e objeto some ao concluir.

- [ ] **10.6 — E2E Home**
  - Dependências: 10.5.
  - **DoD:** Maestro cobre primeiro acesso, entrada hoje, vencida, mês vazio e sem próximo Trabalho.

---

## Fase 11 — Perfil e importação

Pré-requisito documental: UX e design de Perfil presentes.

- [ ] **11.1 — Implementar Perfil principal Free/Premium**
  - Dependências: 3.12, 5.3, 2.5.
  - Identidade, grupos, card Premium/linha ativa e privacidade.
  - **DoD:** assinante não recebe venda; Free mantém configurações/importação acessíveis.

- [ ] **11.2 — Implementar edição de perfil/avatar**
  - Dependências: 3.2, 3.6, 11.1.
  - **DoD:** campos condicionais, upload privado, troca e remoção de avatar testados.

- [ ] **11.3 — Implementar telas de Locais**
  - Dependências: 6.1, 5.6.
  - Lista, vazio, novo e edição.
  - **DoD:** nome obrigatório, contagem correta, paleta por plano e arquivamento preservam histórico.

- [ ] **11.4 — Implementar tela de Residência**
  - Dependências: 3.9, 11.1.
  - Dados/vazio/edição.
  - **DoD:** usuário Free cria recorrência mensal automática; desativar mantém recebidos e invalida futuros.

- [ ] **11.5 — Implementar preferências de Trabalho**
  - Dependências: 3.2, 6.4.
  - **DoD:** defaults preenchem novo Trabalho e podem ser alterados por ocorrência.

- [ ] **11.6 — Implementar infraestrutura de importação**
  - Dependências: 3.4, 3.6, 3.7, P02 para parser Plantãozinho final.
  - Upload privado, análise, preview, confirmação atômica e issues.
  - **DoD:** fixtures CSV/XLSX válidas, parciais, vazias, inválidas e repetidas; nada grava antes da confirmação.

- [ ] **11.7 — Implementar UI de importação**
  - Dependências: 11.6, UX/design Perfil.
  - Entrada, já importou, instruções, progresso, preview, conclusão, pendências e erros.
  - **DoD:** ilegível ≠ vazio; campos ausentes não são inventados; importação continua Free.

- [ ] **11.8 — Implementar configurações estáticas/conta**
  - Dependências: 11.1, 4.6, 1.5.
  - Aparência, conta/segurança, ajuda, feedback, termos e privacidade.
  - Exclusões finais dependem de P05/P04.
  - **DoD:** tema escuro aparece indisponível; links configurados; logout funciona; nenhuma ação destrutiva é inventada.

- [ ] **11.9 — E2E Perfil/importação**
  - Dependências: 11.8.
  - **DoD:** Maestro cobre local Free/Premium, residência Free, import válido/parcial/erro e estado Premium ativo.

---

## Fase 12 — Notificações e calendário externo

- [ ] **12.1 — Implementar preferências e permissão de notificação**
  - Dependências: 3.2, 11.1.
  - Separar toggle do usuário do status do sistema.
  - **DoD:** negar permissão não altera preferência silenciosamente; UI reflete ambos os estados.

- [ ] **12.2 — Registrar tokens e enviar push de teste**
  - Dependências: 3.4, 12.1.
  - **DoD:** APNs e FCM entregam em devices reais; token inválido é revogado.

- [ ] **12.3 — Implementar lembretes de Trabalho**
  - Dependências: 6.2, 12.1.
  - Agendar/reagendar/cancelar duas horas antes conforme preferência.
  - **DoD:** edição/exclusão não deixa lembrete órfão; timezone testado.

- [ ] **12.4 — Implementar lembretes financeiros**
  - Dependências: 3.11, 12.1, 12.2.
  - Dia previsto e lembrete semanal de sem data.
  - **DoD:** recebido não notifica; preferência off impede envio; residência Free participa como Recebível.

- [ ] **12.5 — Implementar integração unidirecional com calendário**
  - Dependências: 6.2, UX/design Perfil.
  - Expo Calendar, permissão, calendário DOKH e IDs por device.
  - **DoD:** criar/editar/excluir Trabalho sincroniza sem duplicar; eventos externos nunca alteram Supabase.

---

## Fase 13 — Analytics, observabilidade e flags

- [ ] **13.1 — Integrar Sentry**
  - Dependências: 1.9.
  - Ambientes, source maps, sanitizer e ErrorBoundary.
  - **DoD:** erro forçado preview chega com stack legível e sem PII/valor financeiro.

- [ ] **13.2 — Definir catálogo de eventos**
  - Dependências: UX docs.
  - Eventos por fluxo e propriedades permitidas.
  - **DoD:** catálogo revisado não contém texto livre, valores ou nomes de local.

- [ ] **13.3 — Integrar PostHog**
  - Dependências: 13.2.
  - Provider, consentimento conforme política, eventos e flags.
  - **DoD:** evento/flag em preview funcionam; falha do PostHog não bloqueia produto.

- [ ] **13.4 — Instrumentar funis críticos**
  - Dependências: 13.3, features correspondentes.
  - Onboarding, primeiro Trabalho, confirmação, importação e Premium.
  - **DoD:** eventos aparecem uma vez, ordem correta e sem PII.

- [ ] **13.5 — Gate de versão mínima**
  - Dependências: 13.3, 1.9.
  - Flag/config remota com modo informativo e obrigatório.
  - **DoD:** versões de teste exercitam ambos os modos; indisponibilidade da flag tem fallback seguro.

---

## Fase 14 — Hardening, compliance e release

- [ ] **14.1 — Fechar pendências legais e retenção**
  - Dependências: P04.
  - Política de privacidade, termos, support URL, retenção e job de limpeza de imports/logs.
  - **DoD:** textos/URLs aprovados, job testado e formulários de loja coerentes com coleta real.

- [ ] **14.2 — Auditoria de segurança**
  - Dependências: features completas.
  - RLS, Storage, secrets, dependências, logs, deep links e account deletion.
  - **DoD:** checklist sem achados críticos; testes de acesso cruzado verdes.

- [ ] **14.3 — Auditoria financeira e timezone**
  - Dependências: Fases 7–12.
  - Fixtures douradas para caixa, competência, residência, viradas e valor/hora.
  - **DoD:** valores esperados aprovados e testes congelados; nenhum float monetário.

- [ ] **14.4 — Auditoria de acessibilidade**
  - Dependências: UI completa.
  - VoiceOver, TalkBack, Dynamic Type, contraste e reduce motion.
  - **DoD:** fluxos críticos completáveis sem visão; bloqueadores corrigidos.

- [ ] **14.5 — Matriz de dispositivos**
  - Dependências: UI completa.
  - iPhone padrão, iPhone com Dynamic Island, iPad, dois Android de fabricantes distintos e tablet Android.
  - **DoD:** relatório com screenshots e zero blocker/crash/layout inoperável.

- [ ] **14.6 — Testar billing nas lojas**
  - Dependências: 5.5.
  - Sandbox iOS e License Testers Android: compra, restore, expiração e troca de conta.
  - **DoD:** entitlement cliente/servidor converge em todos os casos; falhas aparecem no Sentry.

- [ ] **14.7 — Preparar fichas das lojas**
  - Dependências: 14.1, 14.4, 14.5.
  - Metadados, screenshots, ícone, Data Safety, privacy nutrition labels, content rating e review notes.
  - **DoD:** todos os campos obrigatórios completos e coerentes com SDKs/dados reais.

- [ ] **14.8 — Release candidate**
  - Dependências: 14.2–14.7.
  - EAS production build, smoke completo, OTA compatível e plano de rollback.
  - **DoD:** builds assinados instalados nos dois sistemas; testes críticos verdes; versão/tag criada.

- [ ] **14.9 — Submeter às lojas**
  - Dependências: 14.8.
  - EAS Submit e acompanhamento de review.
  - **DoD:** ambas as submissões aceitas para revisão; pendências/respondidas documentadas.

---

## Critério de conclusão do MVP

O MVP só está concluído quando:

- todas as tarefas não explicitamente adiadas estão marcadas com evidência;
- fluxos Free e Premium foram testados nas duas plataformas;
- residência gera recorrência mensal Free sem tocar em `work_series`;
- recorrência de Trabalho exige Premium no cliente e servidor;
- caixa e competência batem com fixtures aprovadas;
- RLS e exclusão de conta foram verificadas;
- estados loading/erro/vazio/dados são distintos;
- UX e design foram validados nos cenários documentados;
- App Store e Google Play aceitaram os builds para revisão.
