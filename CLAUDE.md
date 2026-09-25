# Instruções permanentes para agentes — DOKH

> Este arquivo é o contrato operacional do repositório. Embora mantenha o nome solicitado `CLAUDE.md`, o Codex carrega instruções automaticamente por `AGENTS.md`. No repositório de desenvolvimento, este conteúdo deve ser espelhado ou renomeado para `AGENTS.md`; se ambos existirem, devem permanecer idênticos ou `AGENTS.md` deve apontar para este arquivo.

## Missão do projeto

Construir a DOKH, aplicativo mobile em Expo/React Native para profissionais médicos organizarem rotina de trabalho, entradas previstas e evolução financeira.

A DOKH não é banco, prontuário, folha de pagamento nem sistema contábil. O MVP organiza dados inseridos/importados pela própria pessoa.

## Fontes de verdade e precedência

Leia a documentação relevante antes de alterar código.

1. Pedido explícito atual do usuário.
2. `CLAUDE.md`/`AGENTS.md` — regras permanentes de execução.
3. `decisions.md` — arquitetura e stack.
4. `domain-model.md` — entidades, relações, invariantes e cálculos.
5. Arquivo UX da seção — comportamento, cenários, estados e limites Free/Premium.
6. HTML de design da seção — aparência, hierarquia, conteúdo e motion.
7. `build-plan.md` — ordem, dependências e Definition of Done.
8. Código existente e testes — implementação atual, nunca justificativa para contrariar as fontes acima.

Quando houver conflito:

- aplique a fonte de maior precedência;
- registre a divergência na entrega;
- se a solução exigir uma decisão de produto não registrada, pare somente o trecho afetado e avance no restante seguro;
- não transforme exemplos visuais em regras de negócio.

## Documentos por área

Antes de trabalhar em uma seção, ler:

| Área | UX | Design | Domínio adicional |
| --- | --- | --- | --- |
| Onboarding | `docs/screens/onboarding.md` | `design/onboarding.html` | Perfil, Residência, Trabalho e Recebível |
| Home | `docs/screens/home.md` | `design/home.html` | Projeções e Review Card |
| Agenda | `docs/screens/agenda.md` | `design/agenda.html` | Trabalho, Local e Série |
| Finanças | `docs/screens/financas.md` | `design/financas.html` | Recebível, caixa, competência e Premium |
| Perfil | `docs/screens/perfil.md` | `design/perfil.html` | Perfil, importação, assinatura e preferências |

Se os arquivos ainda estiverem com os nomes originais exportados, localizar pelo conteúdo e normalizar somente em tarefa própria; não editar os HTMLs de referência para facilitar implementação.

## Ferramentas de agente e ambiente

O projeto é desenvolvido ao longo do tempo com **Claude Code e Codex**, alternando entre eles.

- `CLAUDE.md` é a fonte canônica. `AGENTS.md` é uma **cópia idêntica** gerada por `node scripts/sync-agents.mjs` (`--check` valida no CI). Nunca editar `AGENTS.md` diretamente: edite `CLAUDE.md` e sincronize.
- As duas ferramentas seguem o mesmo contrato: branch `codex/<task-id>-<slug>` (prefixo único, independente da ferramenta), commit `[<task-id>] descrição` e checkbox do `build-plan.md` como estado compartilhado do progresso.
- Ao retomar uma tarefa iniciada por outra ferramenta, ler `git log`, o diff da branch e o `build-plan.md` antes de agir. Se deixar uma tarefa incompleta, registrar no PR o que falta e o que já foi verificado.

### Expo e ambiente local

- Node conforme `.nvmrc` (22 LTS): `fnm use`. Gerenciador de pacotes: `npm`.
- O Expo muda a cada SDK e o seu conhecimento prévio pode estar desatualizado. Antes de tocar qualquer API Expo, EAS ou React Native: ler a versão de `expo` no `package.json`, consultar `https://docs.expo.dev/versions/v<major>.0.0/` e o índice `https://docs.expo.dev/llms.txt`. Não responder de memória.
- Instalar bibliotecas Expo/nativas com `npx expo install <pacote>` (resolve a versão compatível com o SDK), nunca com `npm install` direto. Bibliotecas puramente JS (zod, zustand, date-fns etc.) usam `npm install`.
- Rotas ficam em `app/` **na raiz**, conforme o README. Não criar `src/app/`: o Expo Router daria precedência a ele.
- `ios/` e `android/` não são versionados (Continuous Native Generation). Configuração nativa vai em `app.json`/config plugins.
- Testes manuais são feitos no **Expo Go** (`npm run start`, QR code ou `i` para o simulador iOS). Enquanto for assim, só usar bibliotecas incluídas no Expo Go. Bibliotecas com código nativo fora do Expo Go (RevenueCat, Sentry nativo, notificações push remotas etc.) exigem development build (D02): adicionar somente na tarefa correspondente e registrar a mudança de fluxo no PR.
- **Não dirigir o simulador iOS para verificação.** O usuário testa no próprio iPhone pelo Expo Go. Ao final de cada entrega com UI, fornecer um bloco bash pronto (checkout da branch + `npx expo start --clear`) e dizer o que conferir no app.
- Antes de concluir qualquer tarefa: `npm run typecheck`, `npm run check` e `npm test` (quando existirem) e `npx expo-doctor`.
- Testes (Jest + RNTL 14): `render` e `fireEvent` são **assíncronos** — sempre `await`. Use `renderWithProviders` (`src/test/render.tsx`) para telas com Query. `renderRouter` do Expo Router ainda não aguarda o render: siga o helper de `src/test/routes.test.tsx`. Mocks de módulos nativos ficam em `src/test/native-mocks.setup.ts`.
- `npm run typecheck` gera os tipos de rota (`scripts/generate-route-types.mjs`) antes do `tsc`; não é preciso subir o Metro.
- Preparação para billing: ver `docs/billing-readiness.md` antes de mexer em identidade do app, sessão, `subscription_entitlements` ou deep links.

## Regras de produto que nunca podem ser inferidas de outro modo

- Recorrência de Plantão, Procedimento ou Atendimento é Premium.
- A bolsa de residência é recorrente automaticamente e é Free. É o único recorrente gratuito do MVP.
- Residência não usa `work_series`, não aparece na Agenda e gera Recebíveis mensais.
- Importação é Free.
- Cor automática e criação de Trabalho único são Free.
- Paleta ampliada, recorrência de Trabalho, valor/hora, análises, insights e projeção são Premium conforme os UX docs.
- Um pagamento nunca vira recebido automaticamente; a pessoa confirma.
- Pendência não é erro e não usa vermelho.
- Estado vazio não representa falha de carregamento.
- Sem histórico não produz média, tendência ou `0%` inventado.
- Sem data de entrada é um estado válido; o valor fica fora do total de caixa do mês.
- Caixa e competência nunca são misturados.
- Agenda e Finanças não possuem cópias editáveis independentes de um Trabalho/Recebível.

## Guardrails obrigatórios

### Segurança e privacidade

- Nunca commitar secrets, tokens, chaves, service role ou arquivos `.env` reais.
- Nunca colocar service role no bundle mobile.
- Nunca desabilitar RLS, nem temporariamente.
- Nunca confiar em `user_id` enviado pelo cliente; derivar de `auth.uid()`.
- Nunca registrar em logs e analytics: token, e-mail, nome, arquivo importado, texto livre ou valor financeiro detalhado.
- Nunca tornar público bucket de avatar/importação.
- Nunca coletar dados clínicos de pacientes.
- Nunca executar exclusão destrutiva sem confirmar alvo e fluxo autorizado.

### Dados

- Nunca persistir cache de domínio em AsyncStorage, MMKV, SQLite ou filesystem.
- `expo-secure-store` guarda sessão e segredos locais permitidos; não vira banco de domínio.
- Nunca usar `number` de ponto flutuante como representação persistida de dinheiro. API e banco usam centavos inteiros.
- Nunca armazenar status derivável de Recebível como segunda fonte de verdade.
- Nunca criar tabela `agenda_items` ou `finance_items` que duplique os agregados definidos em `domain-model.md`.
- Nunca escrever parcialmente um agregado. Usar RPC/Edge Function transacional.
- Toda alteração de schema exige migration, tipos regenerados, RLS e testes no mesmo PR.

### Stack

- Não instalar biblioteca que duplique uma decisão aceita em `decisions.md`.
- Não adicionar Firebase, outro analytics, outro billing ou outro sistema de navegação.
- Não adicionar NativeWind/Tamagui; usar StyleSheet e tokens.
- Não ativar Realtime, offline-first, atribuição paga ou tema escuro sem nova decisão.
- Usar APIs compatíveis com Expo development builds e EAS.

### Git e entrega

- Não fazer `force push`, rebase destrutivo ou merge direto em `main`.
- Branch: `codex/<task-id>-<slug>`.
- Commit: `[<task-id>] descrição objetiva`.
- Um PR deve resolver uma unidade verificável.
- Não marcar tarefa concluída sem executar a DoD.
- Não modificar arquivos fora do escopo nem descartar mudanças do usuário.

## Estratégia de implementação

### Camadas

```text
app/                         rotas Expo Router; composição fina
src/
  components/               primitives e componentes compartilhados
  features/<feature>/        UI, hooks, schemas e casos de uso da feature
  data/                      client Supabase, queries, mutations e RPCs tipadas
  domain/                    tipos e funções puras de domínio/cálculo
  theme/                     tokens e helpers visuais
  i18n/                      chaves e recursos de idioma
  analytics/                 catálogo tipado e adaptador PostHog
  observability/             adaptador Sentry e sanitização
  test/                      factories e utilitários compartilhados
supabase/
  migrations/               schema versionado
  functions/                Edge Functions
  tests/                     testes SQL/RLS
e2e/                         fluxos Maestro
docs/screens/                UX
design/                      HTMLs somente leitura
```

Regras de dependência:

- `domain` não importa React, Supabase ou UI.
- `data` pode importar tipos de domínio, mas não componentes.
- `features` usam `data`, `domain`, `components` e `theme`.
- `app` compõe features e navegação; não contém cálculo financeiro ou SQL.
- Componentes compartilhados não acessam Supabase diretamente.

### Estado

- Servidor: TanStack Query.
- Formulário: React Hook Form.
- Validação: Zod no cliente e constraints/RPC no servidor.
- UI efêmera: estado local; Zustand somente quando cruza rotas/componentes.
- Sessão: Supabase Auth com SecureStore.

### Queries e mutations

- Centralizar query keys por feature.
- Todas as queries recebem usuário autenticado implicitamente pela sessão.
- Mutations invalidam somente chaves afetadas.
- Não usar optimistic update para confirmação financeira, compra, importação ou exclusão sem rollback testado.
- Erro de mutation preserva os dados digitados.
- Reabrir app, login, retorno ao foreground e reconexão revalidam dados críticos.

### Formulários

- Schema Zod é a definição do payload do cliente.
- Campos monetários convertem string pt-BR para centavos somente ao submeter/validar.
- Datas de pagamento continuam `YYYY-MM-DD` na API.
- Erros de validação são associados ao campo; erros de servidor ficam no formulário sem apagar o rascunho.
- Botões respeitam as condições explícitas do UX; não inventar obrigatoriedade.

## Telas, teclado e rolagem

Regras permanentes, pedidas pelo usuário em 2026-09-25 após testes no iPhone:

- **O onboarding não rola.** Da apresentação ao cadastro do primeiro Trabalho, os HTMLs foram desenhados para caber em 390×844: se o conteúdo não couber, ajuste espaçamentos, tamanhos e agrupamentos em vez de acrescentar rolagem. Nas demais áreas do app, decida por tela com o UX e o HTML correspondentes — listas longas (extrato, locais, catálogo) rolam normalmente.
- **Nada fica atrás do teclado.** Campos de texto, listas de sugestão e seletores precisam continuar visíveis com o teclado aberto (`KeyboardAvoidingView` e, quando houver lista, `keyboardShouldPersistTaps="handled"`).
- **O botão de avançar acompanha o teclado**, com respiro entre o topo do botão e o teclado. Nunca deve ser preciso fechar o teclado para encontrá-lo; um toque só avança.
- **Escolha feita fecha o teclado** e remove a lista de opções.
- **Teclado sem tecla de fechar** (numérico, decimal) fecha ao tocar fora dele; quando o que vem depois não cabe acima do teclado, o botão primeiro só baixa o teclado e revela o resto.
- **Seletores nativos de horário e data abrem numa folha** (`BottomSheet`) com confirmação, nunca embutidos numa tela que não rola, onde empurrariam ou cobririam o botão.
- Sem barra de rolagem visível quando houver rolagem legítima (`showsVerticalScrollIndicator={false}`), e a rolagem é da tela inteira, nunca de uma área interna.

## Tratamento técnico de estados

Quando o UX não desenhar estados técnicos, usar o padrão compartilhado abaixo sem criar novas regras de negócio:

### Loading

- Primeira carga: skeleton estrutural que não mostra valores falsos.
- Refetch com dados existentes: manter dados e indicar atualização discretamente.
- Mutation: bloquear somente a ação afetada e impedir duplo envio.

### Erro de leitura

- Manter separado do estado vazio.
- Exibir mensagem neutra, ação `Tentar novamente` e enviar erro sanitizado ao Sentry.
- Não mostrar dados zerados ou `R$ —` como se fossem dados válidos.

### Erro de escrita

- Preservar formulário/seleção.
- Exibir falha junto à ação ou em feedback transitório acessível.
- Permitir nova tentativa quando idempotente.
- Não simular sucesso antes da confirmação do servidor em operações financeiras.

### Offline

- Informar indisponibilidade de atualização.
- Não enfileirar escrita.
- Dados já mantidos em memória podem continuar visíveis com indicação de desatualização.

### Vazio

- Só usar depois de uma resposta válida do servidor.
- Seguir exatamente o estado vazio do UX da seção.

## Free e Premium

- Gates visuais usam estado do RevenueCat.
- Escritas Premium validam `subscription_entitlements` no servidor.
- Feature flag não substitui entitlement.
- Se o estado local divergir do servidor, negar somente a operação Premium, atualizar entitlement e explicar sem perder o formulário.
- Residência recorrente nunca consulta entitlement.
- Paywall usa somente produtos retornados pela offering ativa; não hardcodar preço.
- Restore purchase deve existir nos dois sistemas operacionais.

## Analytics

- Registrar evento apenas se existir no catálogo tipado.
- Propriedades permitidas são categóricas, booleanas, contagens ou IDs internos não reversíveis.
- Não enviar nome de local, especialidade em texto livre, quantia ou conteúdo de arquivo.
- Eventos mínimos por fluxo: visualização, início, sucesso, falha categorizada e abandono quando tecnicamente mensurável.
- Não bloquear ação de usuário porque analytics falhou.

## Testes obrigatórios por tipo de mudança

| Mudança | Testes mínimos |
| --- | --- |
| Função de domínio/cálculo | Unitários com limites e timezone. |
| Formulário | Schema + componente: válido, inválido e erro servidor. |
| Query/mutation | Integração com Supabase local ou mock de contrato tipado. |
| Migration/RLS | Testes SQL: dono, outro usuário e anônimo. |
| Componente visual | Estados principais e acessibilidade. |
| Fluxo crítico | Maestro em iOS e Android antes de fechar a fase. |
| Billing | Sandbox App Store e License Tester Google Play. |
| Importação | Fixtures válidas, parciais, vazias, inválidas e duplicadas. |

Cálculos financeiros devem cobrir:

- item sem data;
- data hoje, passada e futura;
- recebimento em mês diferente da competência;
- primeiro mês sem histórico;
- duração ausente;
- residência automática Free;
- virada de ano e último dia do mês.

## Processo para executar uma tarefa

1. Ler `docs/HANDOFF.md` (estado atual e armadilhas) e identificar o ID no `build-plan.md`.
2. Ler dependências, decisões, domínio, UX e design aplicáveis.
3. Confirmar que nenhuma pendência humana bloqueia o trecho.
4. Inspecionar o estado atual e preservar mudanças existentes.
5. Implementar a menor solução completa.
6. Rodar typecheck, Biome e testes proporcionais ao risco.
7. Validar visualmente em iOS e Android quando houver UI.
8. Atualizar documentação/migration/tipos quando necessário.
9. Marcar checkbox apenas com evidência da DoD.
10. Entregar resumo, arquivos alterados, testes executados e lacunas reais.
11. Atualizar `docs/HANDOFF.md` com o novo estado antes de encerrar a sessão.

## Definition of Done global

Uma tarefa só está concluída quando:

- comportamento corresponde ao UX;
- visual corresponde ao design nos estados cobertos;
- Free/Premium está correto no cliente e servidor;
- acessibilidade básica foi verificada;
- loading, erro, vazio e dados não se confundem;
- dados respeitam o domínio e RLS;
- testes relevantes passaram;
- nenhum secret/PII foi adicionado;
- documentação e build plan refletem a implementação real.
