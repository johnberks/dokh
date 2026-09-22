# UX — Onboarding

## Escopo

Este documento descreve o comportamento das telas de entrada, autenticação e configuração inicial da DOKH representadas em `DOKH Onboarding MVP.html`. Os valores, nomes, datas e instituições exibidos no design são exemplos de conteúdo, não valores fixos do produto.

## Objetivo da seção

Levar a pessoa da apresentação do produto até uma Home minimamente útil, coletando somente:

- como ela quer ser chamada;
- se faz residência e, quando aplicável, os dados financeiros dessa residência;
- um primeiro trabalho e sua previsão de entrada.

O fluxo separa decisões: uma decisão principal por tela, coleta em fundo claro e aberturas/conclusões em fundo escuro.

## Fluxo principal

1. Splash.
2. Carrossel: trabalhos → entradas → ganhos.
3. Criar conta.
4. Introdução ao onboarding.
5. Nome.
6. Situação de residência.
7. Informações da residência, somente quando aplicável.
8. Conclusão do perfil.
9. Tipo do primeiro trabalho.
10. Local.
11. Data e, conforme o tipo, horário e duração.
12. Valor e previsão de entrada.
13. Conclusão dinâmica.
14. Home.

O fluxo secundário de uma pessoa que já possui conta é: Criar conta → Entrar → Home.

## Cenários e estados

### Entrada e apresentação

| Cenário | Informações obrigatórias na tela | Comportamento |
| --- | --- | --- |
| Splash | Símbolo/assinatura DOKH | As duas superfícies do símbolo se aproximam até formar a interseção bronze. A transição para o primeiro slide é automática. |
| Slide 1 — Trabalhos | Proposta de valor, exemplo de trabalho, horário, valor e data de entrada | `Continuar` avança para Entradas. Swipe horizontal também navega. `Pular` leva à criação de conta. |
| Slide 2 — Entradas | Total a receber, distribuição mensal e exemplos de entradas | `Continuar` avança para Ganhos. `Pular` leva à criação de conta. |
| Slide 3 — Ganhos | Ganhos do mês, variação e composição por tipo | `Começar` e `Pular` levam à criação de conta. |

O indicador do carrossel deve refletir a página atual. O conteúdo apresenta janelas reais do produto; não é um formulário e não altera dados.

### Conta e acesso

| Cenário | Informações obrigatórias na tela | Comportamento |
| --- | --- | --- |
| Criar conta | Apple, Google, e-mail, acesso para quem já tem conta e links para Termos de Uso e Política de Privacidade | Qualquer método de criação segue para o workflow de autenticação correspondente. Esse workflow não está desenhado. `Entrar` abre a tela de login. |
| Entrar | Apple, Google, e-mail, senha, `Esqueci minha senha` e acesso para criar conta | Login concluído leva à Home. Recuperação de senha e autenticação social não estão detalhadas no design. |

### Perfil inicial

| Cenário | Informações obrigatórias na tela | Comportamento |
| --- | --- | --- |
| Introdução | Explicação curta e CTA `Vamos começar` | CTA abre a coleta do nome. |
| Nome | Campo de primeiro nome e orientação de que o primeiro nome basta | O nome informado personaliza as próximas telas. `Continuar` leva à pergunta sobre residência. |
| Faz residência | Pergunta Sim/Não | `Sim` revela a seleção de especialidade na mesma tela. `Não` elimina a etapa de dados da residência. |
| Residência selecionada | Especialidade/programa selecionado | `Continuar` abre os dados financeiros da residência. |
| Dados da residência | Especialidade, valor líquido mensal e dia recorrente de entrada | O dia é escolhido como dia do mês, não em calendário. O valor e o dia alimentam Home e Finanças como entrada recorrente. |
| Perfil concluído com residência | Card da residência com especialidade, valor e dia de entrada | Explica que a residência já é a primeira entrada e convida a registrar outro trabalho. |
| Perfil concluído sem residência | Mensagem de transição, sem card de residência | Não cria dado de residência. Convida a registrar o primeiro trabalho. |

A tela de conclusão do perfil contém uma ação `Pular`, mas o destino dessa ação não está definido no design.

### Primeiro trabalho

| Cenário | Informações obrigatórias na tela | Comportamento |
| --- | --- | --- |
| Escolha do tipo | Plantão, Procedimento e Atendimento, cada um com ícone, nome e explicação | Toda a área de cada opção é clicável. O tipo escolhido acompanha as telas seguintes em um chip e define os campos exibidos. |
| Procedimento | Opção de procedimento e, conforme anotação do design, pergunta `Qual procedimento?` | O detalhamento é condicional ao tipo. A tela específica desse campo não foi desenhada separadamente. |
| Local | Tipo escolhido e nome do local | Local é obrigatório para avançar. O design solicita somente o nome; outros dados são organizados depois. |
| Data — Plantão | Calendário, data selecionada, início e duração | Data, horário de início e duração são obrigatórios para Plantão. O término é calculado e exibido, inclusive quando ocorre no dia seguinte. |
| Data — Procedimento/Atendimento | Calendário e data selecionada | A data é obrigatória. Horário e duração ficam opcionais atrás de `+ Adicionar horário`. |
| Valor e previsão | Valor do trabalho e estado da previsão | A previsão sempre termina em um estado conhecido: data definida ou `Ainda não sei quando entra`. Atalhos de 30, 60 e 90 dias podem definir a data. |
| Conclusão | Total previsto e cards somente dos itens cadastrados | `Ir para o início` leva à Home. A tela não exibe campos ou linhas ausentes. |

## Informações e regras obrigatórias

### Campos obrigatórios para progressão

Com base nas anotações do design:

- Nome: deve existir para personalizar o onboarding.
- Situação de residência: Sim ou Não.
- Especialidade/programa: obrigatória quando a resposta de residência for Sim.
- Valor mensal e dia de entrada da residência: necessários na etapa condicional da residência.
- Tipo do trabalho: Plantão, Procedimento ou Atendimento.
- Local do trabalho.
- Data do trabalho.
- Horário de início e duração: obrigatórios somente em Plantão.
- Valor do trabalho.
- Previsão de entrada: uma data ou a opção `Ainda não sei quando entra`.

O design não especifica o estado visual de validação nem se todos os CTAs ficam desabilitados antes do preenchimento. A implementação não deve inventar mensagens de erro sem uma definição posterior.

### Resumo dinâmico

- Com residência: exibir o card da residência e somá-la ao total previsto.
- Sem residência: omitir completamente o card, sem placeholder.
- Sem horário/duração opcional: omitir a linha correspondente.
- Sem data prevista de pagamento: exibir `Sem previsão de entrada`.
- O total e a contagem devem considerar somente os itens efetivamente cadastrados.

## Free e Premium

O onboarding desenhado não apresenta bloqueio, upsell ou comportamento diferente entre Free e Premium. Toda a configuração inicial mostrada deve ser tratada como funcionalidade base.

Não há autorização no design para:

- interromper o onboarding com paywall;
- bloquear tipos de trabalho;
- limitar o cadastro da residência;
- exigir Premium para informar valor ou previsão de entrada.

## Comportamentos gerais

- Voltar retorna à decisão anterior preservando o que já foi informado; a política de persistência além da sessão não está especificada.
- O tipo de trabalho selecionado deve permanecer visível nas etapas seguintes.
- Seleções não podem depender apenas de cor; o design combina cor, texto, ícone e estrutura.
- Bronze marca seleção ativa e datas de entrada; não deve virar uma grande superfície de interface.
- A residência é uma fonte recorrente. Não deve ser tratada como um trabalho avulso.
- Quando a previsão de entrada é desconhecida, o trabalho continua válido e aparecerá em Finanças como item sem previsão.

## Cenários de dados na tela

| Estado dos dados | Resultado esperado |
| --- | --- |
| Residência + primeiro trabalho + datas conhecidas | Conclusão mostra os dois itens, total combinado e datas de entrada. |
| Sem residência + primeiro trabalho | Conclusão mostra somente o trabalho. |
| Procedimento ou Atendimento sem horário | Data e valor aparecem; a linha de horário/duração não existe. |
| Trabalho sem previsão de entrada | Item aparece com `Sem previsão de entrada`; não recebe data fictícia. |
| Primeiro acesso ainda sem histórico | Nenhuma comparação ou tendência é criada no onboarding. |

## Erros, pendências e lacunas

### Estados previstos pelo design

- `Ainda não sei quando entra` não é erro. É um estado válido que cria uma pendência posterior em Finanças.
- A ausência de residência não é erro e não reduz o acesso ao produto.
- Campos condicionais ausentes não devem gerar placeholders na conclusão.

### Estados não especificados no design

Não há telas ou regras para:

- falha de autenticação Apple/Google/e-mail;
- e-mail inválido, senha inválida ou conta já existente;
- falha de rede, timeout ou modo offline;
- falha ao salvar perfil, residência ou trabalho;
- carregamento, tentativa novamente ou recuperação de progresso interrompido;
- permissões, bloqueios de calendário ou fuso horário;
- mensagens de validação de valores, datas ou horários inválidos.

Esses estados devem permanecer como lacunas de especificação, não como comportamentos implícitos deste documento.
