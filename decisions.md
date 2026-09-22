# Decisões de arquitetura — DOKH

## Como usar este documento

Este arquivo registra decisões técnicas vinculantes. Uma implementação só pode divergir quando a decisão for alterada explicitamente aqui.

Status:

- **Aceita**: usar sem reavaliar alternativas durante a tarefa.
- **Pendente de produto**: não inventar; bloquear apenas o trecho dependente.
- **Substituída**: manter para histórico, apontando a decisão nova.

## Aplicação e repositório

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D01 | Aceita | Aplicativo mobile em Expo + React Native + TypeScript. | Uma codebase para iOS e Android. Não criar versão web no MVP. |
| D02 | Aceita | Expo com development builds/EAS, não apenas Expo Go. | SDKs nativos como RevenueCat, Sentry e calendário devem ser testados no development build. |
| D03 | Aceita | Expo Router para navegação tipada e deep links. | Rotas por arquivo, grupos para autenticação, onboarding e tabs. |
| D04 | Aceita | Repositório único, aplicação única; `npm` e `package-lock.json`. | Não criar monorepo nem misturar gerenciadores. |
| D05 | Aceita | TypeScript `strict: true`, sem `any` implícito. | Tipos gerados do Supabase e schemas Zod são parte do contrato. |
| D06 | Aceita | Código, banco e eventos em inglês; conteúdo de interface em pt-BR. | Evita nomes técnicos traduzidos e mantém copy no sistema de i18n. |

## Interface e design system

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D07 | Aceita | React Native `StyleSheet` + tokens próprios como estratégia de estilo. | Não usar NativeWind, Tamagui ou outra camada de design system no MVP. Os HTMLs são referência visual, não código para transpilar. |
| D08 | Aceita | Tokens centralizados para cor, tipografia, espaçamento, raio, sombra e motion. | Hexadecimais e medidas não devem se espalhar por componentes. |
| D09 | Aceita | Fontes: Archivo na interface, IBM Plex Mono em etiquetas/dados técnicos e Unbounded 600 exclusivamente no wordmark. | Carregar por `expo-font`; respeitar fallback e estados de carregamento. |
| D10 | Aceita | Ícones em `lucide-react-native`; símbolo DOKH como asset vetorial próprio. | Não substituir o símbolo por ícone genérico. |
| D11 | Aceita | `react-native-reanimated` para carrossel, remoção de Review Card e motion especificado. | Respeitar `reduce motion`; nenhuma animação decorativa extra. |
| D12 | Aceita | Componentes compartilhados documentados: AppShell, Header, BottomTabs, ReviewCard, WorkCard, EmptyState, BottomSheet, MoneyInput, TypeSelector e PremiumGate. | Duplicação visual entre telas deve virar componente, sem acoplar regra de negócio ao componente visual. |
| D13 | Aceita | Bronze é acento raro; estados de pendência não usam vermelho. | Vermelho/negativo só para perda ou erro real e com contraste acessível. |
| D14 | Aceita | Acessibilidade mínima: alvo de toque de 44×44, labels para leitores de tela, Dynamic Type até o limite de layout e contraste WCAG AA. | Cor nunca pode ser o único indicador de estado. |

## Navegação

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D15 | Aceita | Grupos: `(auth)`, `(onboarding)`, `(tabs)` e modais/sheets no nível adequado. | Sessão e conclusão do onboarding decidem o redirect inicial. |
| D16 | Aceita | Tabs: Início, Agenda, ação central de criar Trabalho, Finanças e Perfil. | A ação central não é uma tab; abre o mesmo fluxo de criação usado pela Agenda. |
| D17 | Aceita | Bottom sheets e modais são rotas ou componentes controlados por navegação, com retorno previsível e suporte ao botão voltar do Android. | Não manter navegação crítica apenas em estado local efêmero. |
| D18 | Aceita | Deep links cobrem autenticação, restauração de compra e destinos de notificação. | Esquema/Universal Links devem ser configurados antes de release. |

## Backend, dados e estado

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D19 | Aceita | Supabase para Postgres, Auth, Storage e Edge Functions. | Não adicionar Firebase ou backend paralelo. |
| D20 | Aceita | Supabase é a única fonte de verdade de domínio; estratégia online-first. | Sem banco local, fila offline ou persistência de cache de domínio. |
| D21 | Aceita | TanStack Query para estado do servidor, cache em memória e invalidação. | `persistQueryClient` é proibido no MVP. Reabrir/reconectar sempre revalida. |
| D22 | Aceita | Zustand apenas para estado de UI transitório e rascunho da sessão atual. | Não duplicar entidades do Supabase em stores globais. |
| D23 | Aceita | React Hook Form + Zod para formulários. | Schemas compartilháveis validam cliente; servidor valida novamente. |
| D24 | Aceita | Migrations e seed via Supabase CLI, versionados no Git. | Nunca editar schema manualmente apenas no Dashboard. |
| D25 | Aceita | Tipos do banco são gerados e versionados após migrations. | CI falha quando schema e tipos divergem. |
| D26 | Aceita | Toda tabela de usuário usa RLS; service role somente em Edge Functions. | Nenhum bypass temporário de RLS. |
| D27 | Aceita | Operações de agregado usam RPC/Edge Function atômica e idempotente. | Trabalho + Recebível, importação e recorrência não podem ficar parcialmente gravados. |
| D28 | Aceita | Supabase Realtime fora do MVP. | Troca sequencial de device é coberta por revalidação; sessões simultâneas não atualizam ao vivo. |

## Domínio financeiro

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D29 | Aceita | Trabalho e Recebível são entidades relacionadas; Agenda lê Trabalho, Finanças lê Recebível e competência do Trabalho. | Não criar itens independentes de Agenda ou Finanças. |
| D30 | Aceita | Residência é configuração recorrente Free, gera Recebíveis mensais automaticamente e não aparece na Agenda. | É o único recorrente gratuito do MVP; não usa `work_series` nem exige Premium. |
| D31 | Aceita | Dinheiro em centavos (`bigint`) e moeda `BRL` no MVP. | Proibido `float`; formatação ocorre somente na borda da UI. |
| D32 | Aceita | Data de pagamento em `date`; confirmação em `timestamptz`; status derivado. | Evita mudança de dia por timezone e duplicação de estado. |
| D33 | Aceita | Caixa e competência são cálculos separados conforme `domain-model.md`. | Um trabalho pode ser gerado em setembro e recebido em outubro sem inconsistência. |
| D34 | Aceita | Recebimento nunca é confirmado automaticamente. | Data vencida vira `confirmation_pending`; pessoa confirma explicitamente. |
| D35 | Aceita | Valor/hora considera somente Trabalhos com duração registrada. | Itens sem duração saem do numerador e denominador. |

## Datas, hora e localização

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D36 | Aceita | Fuso IANA salvo por usuário e por Trabalho. | Cálculos de `hoje`, término e lembretes usam o fuso da ocorrência. |
| D37 | Aceita | `date-fns` para aritmética e `Intl` para formatação. | Não criar utilitários manuais de calendário/moeda. |
| D38 | Aceita | Locale inicial pt-BR e arquitetura i18next desde o primeiro commit. | Nenhum texto de produto hardcoded em componente. |
| D39 | Aceita | Calendário começa conforme preferência Domingo/Segunda. | A grade e os labels devem responder à configuração. |

## Autenticação e segurança

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D40 | Aceita | Supabase Auth com Apple, Google e e-mail/senha. | Os três caminhos exibidos no design devem existir. |
| D41 | Aceita | Sessão persistida apenas pelo adaptador seguro baseado em `expo-secure-store`. | Tokens não ficam em AsyncStorage ou logs. |
| D42 | Aceita | Recuperação de senha e e-mails transacionais via Supabase Auth + Resend/Edge Function quando customização for necessária. | Resend secret fica no servidor. |
| D43 | Aceita | Segredos em EAS Environments/Secrets e arquivos `.env.local` ignorados. | Apenas variáveis `EXPO_PUBLIC_*` não secretas entram no bundle. |
| D44 | Aceita | Logs não contêm token, e-mail, nome, valor financeiro detalhado ou conteúdo importado. | Sentry/PostHog recebem dados minimizados e identificadores internos. |
| D45 | Aceita | Exclusão de conta por Edge Function autenticada, com purge de Auth, banco e Storage. | A operação deve ser observável, idempotente e testada. |

## Premium e billing

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D46 | Aceita | RevenueCat abstrai StoreKit e Google Play Billing. | Não acessar APIs de loja diretamente para entitlement. |
| D47 | Aceita | Um entitlement `premium`, com packages mensal e anual. | Não criar lifetime ou trial sem nova definição. |
| D48 | Aceita | RevenueCat é autoridade de compra; Supabase mantém espelho via webhook idempotente. | UI consulta SDK; escrita Premium valida o espelho no servidor. |
| D49 | Aceita | Gates Premium: recorrência de Trabalhos, paleta ampliada, valor/hora, análises/insights e projeção definidos nos UX docs. | Importação, criação de Trabalho único e recorrência automática da bolsa de residência permanecem Free. |
| D50 | Aceita | Paywall aparece depois do fluxo de benefícios, com restore purchase. | Não abrir compra diretamente a partir de um bloqueio sem a sequência definida. |
| D51 | Pendente de produto | Preços, product IDs e ofertas comerciais. | Bloqueia configuração real das lojas/paywall; placeholders nunca vão para produção. |

## Notificações e calendário externo

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D52 | Aceita | Expo Notifications para push e notificações locais. | Preferência do usuário e permissão do sistema são estados separados. |
| D53 | Aceita | Lembrete de Trabalho pode ser agendado localmente; lembretes financeiros recorrentes usam job servidor quando exigirem confiabilidade cross-device. | Cancelar/reagendar ao editar ou excluir. |
| D54 | Aceita | `expo-calendar` para integração opcional e unidirecional DOKH → calendário do device. | A DOKH continua fonte de verdade; não importar nem editar eventos externos. |
| D55 | Aceita | Eventos externos carregam identificador DOKH para atualização/remoção idempotente. | Um Trabalho não pode criar eventos duplicados no mesmo device. |

## Importação

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D56 | Aceita | Arquivo vai para bucket privado e é analisado em Edge Function; nenhuma linha de domínio é criada antes da confirmação. | Preview e pendências refletem somente conteúdo real do arquivo. |
| D57 | Aceita | CSV UTF-8 e XLSX são formatos técnicos suportados inicialmente. | Mapeamento específico do Plantãozinho deve ser coberto por fixtures. |
| D58 | Aceita | Limite inicial de upload: 10 MB, validado por extensão, MIME e conteúdo. | O limite pode mudar por decisão registrada; não confiar só no cliente. |
| D59 | Aceita | Importação é idempotente por hash do arquivo + usuário e por chave de linha normalizada. | Reenvio não duplica Trabalhos silenciosamente. |
| D60 | Pendente de produto | Layouts reais de exportação do Plantãozinho e política para possíveis duplicatas. | Bloqueia parser de produção, não bloqueia infraestrutura/preview genérico. |

## Analytics, erros e feature flags

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D61 | Aceita | PostHog para eventos, funil, feature flags e surveys. | Eventos usam nomes estáveis e propriedades sem PII. |
| D62 | Aceita | Sentry para crashes, erros e performance crítica. | Source maps enviados pelo EAS; ambientes separados. |
| D63 | Aceita | Eventos de analytics são definidos em catálogo antes de instrumentar. | Proibido emitir evento ad hoc com valores financeiros ou texto livre. |
| D64 | Aceita | Feature flag pode liberar recurso, mas não substituir autorização Premium/RLS. | Gate de segurança continua no servidor. |
| D65 | Aceita | Falha técnica nunca usa estado vazio. | Telas precisam distinguir loading, erro, vazio e dados. Onde UX não define o erro, usar componente técnico neutro aprovado, sem inventar regra de negócio. |

## Qualidade e entrega

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D66 | Aceita | Biome para lint/format; sem ESLint/Prettier paralelos. | Um comando de qualidade. |
| D67 | Aceita | Jest + React Native Testing Library para unitários/componentes e Maestro para E2E. | Cálculos financeiros, schemas e fluxos críticos exigem cobertura. |
| D68 | Aceita | GitHub Actions para typecheck, Biome e testes; EAS para builds, updates e submit. | PR só integra com checks verdes. |
| D69 | Aceita | Branch `codex/<task-id>-<slug>` e PR por unidade verificável. | Não fazer merge direto em `main` nem reescrever histórico compartilhado. |
| D70 | Aceita | OTA apenas para alterações compatíveis com o runtime version. | Mudança nativa exige novo build; usar política de runtime do EAS. |
| D71 | Aceita | Ambientes local, preview e production separados em Supabase, PostHog, Sentry, RevenueCat e EAS. | Nunca testar compra/analytics de desenvolvimento em produção. |

## Privacidade e retenção

| ID | Status | Decisão | Consequência |
| --- | --- | --- | --- |
| D72 | Aceita | Coleta mínima e privacy by design. | Não armazenar dados clínicos de pacientes; a DOKH registra rotina e renda do profissional. |
| D73 | Aceita | Arquivos de importação são privados e removidos após conclusão/expiração da janela operacional. | Job de limpeza obrigatório. |
| D74 | Pendente de produto/jurídico | Prazo exato de retenção de imports, logs e soft deletes; textos legais e URLs. | Deve ser fechado antes de produção e submissão às lojas. |
| D75 | Aceita | Sem SDK de atribuição paga/ATT no MVP. | Não pedir ATT nem adicionar AppsFlyer/Adjust/Branch sem nova decisão. |

## Fora de escopo técnico do MVP

- Web app.
- Open Finance.
- Offline-first e sincronização de conflitos.
- Multiusuário/equipe.
- Realtime entre devices.
- Moedas além de BRL.
- Pagamentos parciais, impostos, custos e estornos.
- Sincronização bidirecional de calendário.
- Atribuição de mídia paga e prompt ATT.
- Tema escuro funcional.

## Pendências que exigem decisão humana

| ID | Pendência | Bloqueia |
| --- | --- | --- |
| P01 | Preços, product IDs e ofertas mensal/anual. | Billing de produção e paywall final. |
| P02 | Fixtures/exportações reais do Plantãozinho e política de duplicatas. | Parser de produção. |
| P03 | UX de recorrência customizada e edição de série versus ocorrência. | Esses dois comportamentos Premium. |
| P04 | Retenção, textos legais, URLs e política de privacidade. | Release nas lojas. |
| P05 | Copy e interação de confirmações destrutivas ainda ausentes nos designs. | Exclusão de Trabalho, Local e Conta em produção. |

As demais partes do projeto podem avançar sem escolher respostas para essas pendências.
