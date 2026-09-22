# DOKH

Aplicativo mobile para profissionais médicos organizarem trabalhos, agenda, entradas previstas e evolução financeira em um só lugar.

Este repositório usa três fontes complementares:

- **Especificação técnica**: estes documentos, arquitetura e modelo de domínio.
- **UX**: comportamento, cenários, estados, regras Free/Premium e lacunas.
- **Design**: HTMLs de referência visual.

Nenhuma dessas fontes substitui as outras.

## Estado do projeto

O progresso atual e o ponto de retomada estão em `docs/HANDOFF.md`. Esta base documental define a construção do MVP. Não presuma que comandos, dependências, ambientes ou infraestrutura já existam até a respectiva tarefa do `build-plan.md` estar concluída.

## Leitura obrigatória

| Arquivo | Responsabilidade |
| --- | --- |
| `CLAUDE.md` | Regras permanentes para agentes e implementação. Para Codex, espelhar como `AGENTS.md`. |
| `decisions.md` | Stack e decisões de arquitetura. |
| `domain-model.md` | Entidades, invariantes, cálculos e segurança de dados. |
| `build-plan.md` | Ordem de execução, dependências e Definition of Done. |
| `docs/screens/*.md` | Comportamento UX de cada seção. |
| `design/*.html` | Referência visual de cada seção. |

Ordem de precedência completa: pedido atual do usuário → instruções do agente → decisões → domínio → UX → design → build plan → código existente.

## Escopo do MVP

### Onboarding

- apresentação do produto;
- cadastro/login com Apple, Google ou e-mail;
- nome e situação profissional;
- residência opcional;
- primeiro Trabalho;
- conclusão e entrada na Home.

### Home

- visão do mês;
- histórico quando houver base;
- próximo Trabalho;
- próximas Entradas;
- pendências acionáveis;
- progresso inicial enquanto incompleto.

### Agenda

- calendário mensal e seleção de dia;
- criação, reutilização, detalhe e edição de Trabalho;
- Plantão, Procedimento e Atendimento;
- recorrência de Trabalho Premium;
- cores de local.

### Finanças

- previsto para entrar;
- recebido × a receber;
- valores sem data;
- extrato mensal;
- origem das entradas;
- trabalho gerado;
- análises, valor/hora, insights e projeções Premium.

### Perfil

- identidade;
- locais, residência e preferências;
- importação do Plantãozinho/arquivo;
- calendário e notificações;
- conta, suporte, privacidade e assinatura.

## Regra Free/Premium essencial

Há dois tipos distintos de recorrência:

1. **Recorrência de Trabalho** — repetir Plantão, Procedimento ou Atendimento; é Premium.
2. **Recorrência da bolsa de residência** — criada automaticamente ao cadastrar residência; é Free.

A bolsa mensal da residência é o único recorrente gratuito do MVP. Ela gera Recebíveis mensais, não cria uma `work_series` e não aparece na Agenda.

### Matriz resumida

| Capacidade | Free | Premium |
| --- | ---: | ---: |
| Trabalho único | Sim | Sim |
| Agenda e extrato | Sim | Sim |
| Importação | Sim | Sim |
| Bolsa de residência recorrente | Sim | Sim |
| Cor automática/básica | Sim | Sim |
| Recorrência de Trabalho | Não | Sim |
| Paleta ampliada | Não | Sim |
| Valor/hora e evolução | Não | Sim |
| Insights e projeção | Não | Sim |

## Arquitetura

```text
Expo / React Native
  ├─ Expo Router                 navegação
  ├─ React Hook Form + Zod       formulários
  ├─ TanStack Query              estado do servidor em memória
  ├─ Zustand                     UI transitória
  ├─ StyleSheet + tokens         interface
  ├─ RevenueCat                  entitlement Premium
  ├─ PostHog                     analytics e flags
  └─ Sentry                      erros e performance
          │
          ▼
Supabase
  ├─ Auth                        Apple, Google, e-mail
  ├─ Postgres + RLS              fonte única de verdade
  ├─ Storage privado             avatar e imports
  └─ Edge Functions/RPC          operações atômicas
```

### Fluxo principal de dados

```text
Trabalho ───────────────► Agenda
    │
    └── Recebível ──────► Home / Finanças

Residência (Free)
    └── Recebíveis mensais ─► Home / Finanças

Série Premium
    └── Trabalhos materializados ─► Agenda + Recebíveis
```

Agenda e Finanças não possuem registros paralelos editáveis. Alterar um Trabalho altera as projeções que o utilizam.

## Stack definida

- Expo + React Native + TypeScript estrito.
- Expo Router.
- Supabase: Postgres, Auth, Storage e Edge Functions.
- TanStack Query, React Hook Form, Zod e Zustand.
- React Native StyleSheet com tokens próprios.
- React Native Reanimated e Lucide React Native.
- RevenueCat.
- PostHog e Sentry.
- Resend para e-mails customizados.
- Expo Notifications e Expo Calendar.
- i18next.
- Biome, Jest, React Native Testing Library e Maestro.
- EAS Build, Update e Submit; GitHub Actions para checks.

Detalhes e restrições estão em `decisions.md`.

## Estrutura esperada

```text
app/
  (auth)/
  (onboarding)/
  (tabs)/
src/
  analytics/
  components/
  data/
  domain/
  features/
    agenda/
    auth/
    finances/
    home/
    onboarding/
    premium/
    profile/
  i18n/
  observability/
  test/
  theme/
supabase/
  functions/
  migrations/
  tests/
docs/screens/
  onboarding.md
  home.md
  agenda.md
  financas.md
  perfil.md
design/
  onboarding.html
  home.html
  agenda.html
  financas.html
  perfil.html
e2e/
CLAUDE.md
AGENTS.md
decisions.md
domain-model.md
build-plan.md
README.md
```

## Configuração local esperada

Pré-requisitos:

- Node compatível com a versão Expo travada no projeto;
- npm;
- Docker para Supabase local;
- Supabase CLI;
- EAS CLI;
- Xcode para iOS;
- Android Studio/SDK para Android;
- development build instalado nos simuladores/devices.

Depois da Fase 0 do build plan, o fluxo local deve ser:

```bash
fnm use            # Node do .nvmrc
cp .env.example .env.local   # preencher com os valores de `npm run supabase:status`
npm ci
npm run supabase:start
npm run supabase:reset
npm run start
```

Para configuração local e isolamento preview/production, veja
[`docs/supabase-local.md`](docs/supabase-local.md). As migrations e a geração de tipos
entram nas tarefas 3.2–3.12; o cliente Supabase entra na 4.1.

Comandos de qualidade esperados:

```bash
npm run typecheck
npm run check
npm test
npm run test:rls
npm run test:e2e
```

Os nomes dos scripts são contratos do projeto e devem ser criados na fundação.

## Variáveis de ambiente

### Permitidas no bundle mobile

Somente valores públicos por natureza:

```text
EXPO_PUBLIC_APP_ENV
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SUPABASE_PREVIEW_PROJECT_REF
EXPO_PUBLIC_SUPABASE_PRODUCTION_PROJECT_REF
EXPO_PUBLIC_POSTHOG_KEY
EXPO_PUBLIC_POSTHOG_HOST
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY
```

### Somente servidor/CI

```text
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
REVENUECAT_WEBHOOK_AUTH_TOKEN
SENTRY_AUTH_TOKEN
EXPO_TOKEN
```

Regras:

- manter `.env.example` sem valores reais;
- local em `.env.local` ignorado pelo Git;
- preview/production em EAS Environments e secrets do Supabase/GitHub;
- nunca prefixar secret com `EXPO_PUBLIC_`.

## Ambientes

| Ambiente | Uso | Dados/compras |
| --- | --- | --- |
| Local | Desenvolvimento e testes Supabase local | Fixtures sintéticas |
| Preview | QA, development builds e PRs | Usuários de teste, RevenueCat sandbox |
| Production | App distribuído | Dados reais e lojas reais |

Cada ambiente usa projetos/chaves separados. Nenhum evento ou compra de desenvolvimento deve contaminar produção.

## Regras de dados

- Dinheiro é inteiro em centavos; BRL no MVP.
- Pagamento previsto é uma data sem horário.
- Recebido depende de confirmação explícita.
- Trabalho pode não ter data de entrada.
- Trabalho gerado usa data do trabalho; previsto para entrar usa data do Recebível.
- Status financeiro é derivado.
- Residência gera Recebíveis mensais gratuitamente.
- Premium é validado no servidor para operações protegidas.
- Toda tabela de usuário usa RLS.
- Nenhum dado de domínio é persistido no device.

Ver `domain-model.md` para o contrato completo.

## Estados técnicos compartilhados

- **Loading**: skeleton sem valores fictícios.
- **Erro de leitura**: mensagem neutra + tentar novamente; nunca parecer vazio.
- **Erro de escrita**: preservar formulário e permitir retry seguro.
- **Offline**: leitura em memória pode permanecer; escrita não é enfileirada.
- **Vazio**: somente após resposta válida e conforme UX.
- **Pendência**: dado incompleto/aguardando ação, sem vermelho.

## Desenvolvimento com Codex

O Codex lê `AGENTS.md` automaticamente, não `CLAUDE.md`. Antes de iniciar desenvolvimento:

1. copiar ou renomear `CLAUDE.md` para `AGENTS.md` no repositório final;
2. manter uma única fonte canônica para evitar divergência;
3. pedir ao Codex uma tarefa identificada do `build-plan.md`;
4. permitir que ele valide a DoD e atualize o checkbox somente após testes.

Exemplo de solicitação:

```text
Implemente a tarefa 2.4 do build-plan.md. Leia AGENTS.md, decisions.md,
domain-model.md e os documentos de UX/design relacionados. Execute a DoD,
rode os testes e atualize o checkbox apenas se tudo passar.
```

## Fluxo de contribuição

1. Escolher tarefa não bloqueada do `build-plan.md`.
2. Criar branch `codex/<id>-<slug>`.
3. Implementar somente o escopo e dependências necessárias.
4. Rodar checks e testes.
5. Validar UI em iOS e Android quando aplicável.
6. Abrir PR com evidências da DoD.
7. Atualizar checkbox no mesmo PR somente se verificado.

## Pendências humanas antes de produção

- preços e product IDs mensal/anual;
- arquivos reais/exportações do Plantãozinho e regra de duplicidade;
- UX de recorrência customizada e edição de série;
- retenção, termos, privacidade e URLs legais;
- confirmações destrutivas ainda não desenhadas.

Essas pendências bloqueiam somente as tarefas relacionadas, não a fundação inteira.

## Fora de escopo do MVP

- web app;
- Open Finance;
- dados clínicos de pacientes;
- offline-first;
- Realtime entre devices;
- multiusuário/equipe;
- moedas diferentes de BRL;
- pagamentos parciais, custos, impostos e estornos;
- sincronização bidirecional com calendário;
- atribuição de mídia paga/ATT;
- tema escuro funcional.
