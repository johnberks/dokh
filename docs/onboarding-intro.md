# Splash e tela de criar conta — tarefa 7.1

Fontes: `design/onboarding.html` (00B Splash e 04 Criar conta) e `docs/screens/onboarding.md`. Decisões: D11 (Reanimated + reduzir movimento), D38 (nenhum texto fora do i18n), D20 (nada de domínio persistido no device), D50/P04 (links legais só com URL configurada).

## Fluxo aprovado pelo usuário (2026-09-24)

`Splash → 04 Criar conta`. Não há carrossel nem `Pular`: depois do splash existe **uma única tela**.

- `Continuar com e-mail` → `/sign-up` (cadastro por e-mail).
- `Já tem uma conta? Entrar` → `/sign-in` (a tela "Bem-vindo de volta.").
- Apple e Google aparecem desabilitados até 4.3/4.4, como no login.

Sem sessão, o guard da 4.5 abre `/intro` (splash + tela 04). Não há estado de "já viu": a tela é o próprio ponto de entrada.

## Splash 00B

- Fundo `#10160F`, símbolo de 96 e assinatura Unbounded 24, com espaço de 28.
- Animação em duas etapas: as superfícies se aproximam (620 ms) e a assinatura entra em seguida, com leve subida (420 ms após 420 ms de atraso). Com a leitura final, o splash dura **~1,4 s** — `SPLASH_DURATION`, coberto por teste que exige entre 1 s e 2 s.
- Com **Reduzir movimento**, símbolo e assinatura aparecem montados e o mesmo tempo de leitura é mantido.
- O símbolo é lido como imagem única chamada "DOKH". O vetor D1 final de produção continua pendente (2.2).

## Tela 04 — Criar conta

- Título aprovado: **"Organize sua rotina e suas finanças em um só lugar."** (substitui "Comece a organizar sua vida financeira." do HTML). Subtítulo e demais medidas seguem o HTML.
- Botões Apple/Google, divisor "ou" e CTA escuro reaproveitam `SocialChoices` e `AuthAction` da 4.2, mantendo a mesma aparência do login.
- Texto legal com uma só família, tamanho e cor; "Termos de Uso" e "Política de Privacidade" aparecem apenas em **negrito**, sem sublinhado (pedido do usuário em 2026-09-24). Enquanto `src/config/legal.ts` tiver URL nula (P04), o trecho não é clicável — nenhum destino é inventado; com URL configurada, vira link mantendo a mesma tipografia.

### Profundidade dos três cartões

`AccountPreview` empilha plantão, a receber e ganhos do mês nas posições do HTML. A sensação de profundidade vem de três recursos, sem alterar cores, tamanhos ou tipografia:

1. **Ordem das camadas**: o cartão claro de plantão fica atrás, o de a receber no meio e o de ganhos à frente.
2. **Elevação crescente**: sombra sutil no primeiro, elevada no segundo e a sombra forte do HTML (0 20 40 a 24%) no terceiro — um teste garante que as elevações são diferentes e crescentes.
3. **Entrada em cascata**: cada cartão sobe e aparece com 90 ms de diferença, do fundo para a frente; com reduzir movimento, todos entram prontos.

A pilha **reserva a própria altura**: o cartão mais baixo é medido no layout e o container fica com `topo + altura`, então os cartões nunca cobrem os botões, mesmo com Dynamic Type. A tela rola quando o conteúdo não couber (sem bounce); em telas grandes nada se move.

A prévia é lida de uma vez pelo leitor de tela ("Prévia do produto: …") e seus números internos ficam ocultos, para não soarem como dados da pessoa.

## Ilustrações guardadas

As três ilustrações dos slides 01–03 (plantões, a receber, ganhos do mês) **não foram descartadas**: vivem em `src/features/onboarding/art/` e aparecem no catálogo interno `/dev/primitives`, seção "Ilustrações do onboarding", prontas para telas futuras. Seus textos de exemplo estão no i18n.

`PrimitivesCatalog` recebeu a prop `extra` para a rota de desenvolvimento compor seções vindas de features — componentes compartilhados continuam sem importar `features`. A regra de camadas do Biome foi corrigida de `@/features/*` para `@/features/**`, que também pega importações profundas.

## Limites

- Apple e Google seguem indisponíveis até 4.3/4.4; o cadastro por e-mail e o login são os caminhos reais.
- Inspeção visual, VoiceOver e Android seguem pendentes pela DoD.
