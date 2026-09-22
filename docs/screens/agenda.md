# UX — Agenda

## Escopo

Este documento descreve a Agenda, o cadastro e a edição de trabalhos representados em `DOKH Agenda.html`. Exemplos de hospitais, valores, datas, cores e horários servem apenas para demonstrar os estados.

## Objetivo da seção

Responder quando e onde a pessoa trabalha e permitir que ela:

- consulte o mês e um dia específico;
- veja trabalhos em ordem de horário;
- reutilize um trabalho conhecido;
- cadastre, consulte, edite ou exclua um trabalho;
- configure recorrência e cores personalizadas quando tiver Premium.

A Agenda não apresenta somas financeiras. Cada trabalho pode mostrar seu próprio valor e estado de pagamento, mas consolidações pertencem a Finanças.

## Estrutura obrigatória da visão mensal

- Header com `Sua agenda`, mês/ano e navegação entre meses.
- Calendário mensal.
- Identificação visual de hoje, do dia selecionado e dos trabalhos existentes.
- Resumo do dia selecionado.
- Lista de trabalhos do dia em ordem de horário ou estado vazio.
- Ação para adicionar trabalho.
- Navegação principal: Início, Agenda, ação central `+`, Finanças e Perfil.

## Regras do calendário

- Hoje usa contorno bronze.
- O dia selecionado usa círculo verde escuro e texto claro.
- Dias passados usam cinza-verde.
- Cada trabalho adiciona um ponto na célula do dia.
- A cor do ponto corresponde ao local do trabalho.
- Dois trabalhos de locais diferentes geram dois pontos.
- Cor nunca é a única informação; os cards trazem horário, tipo e local em texto.
- Tocar em um dia altera a seleção e a lista abaixo sem trocar de tela.
- A seleção inicial no mês atual é hoje.

## Cenários da visão mensal

| Cenário | Informações obrigatórias | Comportamento |
| --- | --- | --- |
| Dia com um trabalho | Dia, horário, tipo, local, valor e status | Exibir um card com barra lateral na cor do local. Tocar abre os detalhes. |
| Dia com múltiplos trabalhos | Contagem e todos os trabalhos do dia | Exibir cards em ordem de horário. A célula mostra um ponto por local/trabalho representado. |
| Dia livre | Dia selecionado e mensagem `Seu dia está livre` | Não exibir card vazio. Mostrar CTA secundário `Adicionar trabalho`. |
| Trabalho recebido | Dados do trabalho e `Recebido` | Exibir check e texto discretos, sem badge. |
| Trabalho previsto | Dados do trabalho e data/status de recebimento | Exibir estado neutro. |
| Trabalho passado sem confirmação | Dados e ação de confirmação quando aplicável | Tratar como pendência, nunca como recebido automático. A aplicação completa desse Review Card está prevista na biblioteca, mas não foi desenhada na Agenda. |

## Adicionar trabalho

### Entrada do fluxo

O `+` central e o `+` da Agenda abrem o mesmo fluxo.

Primeiro deve aparecer a opção de:

- reutilizar um trabalho conhecido; ou
- criar um novo trabalho.

### Usar novamente

Cada template compacto mostra:

- local;
- tipo e duração;
- último horário conhecido;
- valor.

Ao selecionar um template, o formulário é pré-preenchido e o fluxo pergunta principalmente `quando será?`. O design não define quais alterações continuam permitidas antes de salvar; o formulário completo deve continuar sendo a referência.

### Criar novo

O seletor contém:

- Plantão;
- Procedimento;
- Atendimento.

Cada opção usa ícone, título e descrição. Residência não aparece como tipo quando já está cadastrada, porque é gerenciada em Perfil.

## Formulário de trabalho

### Informações obrigatórias na tela

- tipo escolhido;
- local;
- data;
- horário de início quando aplicável;
- duração quando aplicável;
- valor a receber;
- previsão de recebimento;
- opção de repetição;
- opção de cor do local;
- ação de salvar.

### Requisitos explícitos do design

- Salvar fica desabilitado até existir data e valor.
- O local já pode vir preenchido a partir de template ou contexto.
- Para Plantão, início e duração fazem parte do cadastro.
- Para Procedimento e Atendimento, horário/duração não são apresentados como obrigatórios nos designs de onboarding; a Agenda não mostra a variação completa desses formulários.
- A previsão pode ser data específica, 30, 60 ou 90 dias após o trabalho, ou `Ainda não sei`.
- Recorrência e cor personalizada são opcionais e nunca bloqueiam o salvamento base.

### Seleção de data

- Abrir em bottom sheet com o mesmo calendário da Agenda.
- Mostrar os pontos de dias já ocupados para reduzir sobreposição acidental.
- Confirmar exibe a data selecionada no formulário.
- A existência de trabalho no dia não bloqueia a seleção.

### Duração

- Oferecer 6h, 12h, 24h e `Outro`.
- `Outro` abre um stepper de horas.
- O horário de término é calculado; não é digitado diretamente.
- Quando atravessa a meia-noite, mostrar também a data de término.

### Previsão de pagamento

- Explicar que o cálculo parte da data do trabalho.
- Ao lado de 30/60/90 dias, mostrar a data calculada.
- Confirmar retorna ao formulário com a opção e a data resultante.
- `Ainda não sei` mantém o trabalho válido e cria um valor sem data em Finanças.

## Free e Premium

### Disponível no Free

- calendário e consulta por dia;
- trabalhos únicos;
- reutilização de trabalhos conhecidos;
- criação, detalhes e edição;
- datas, horários, duração, valor e previsão de pagamento;
- cor automática do local;
- saída explícita `Continuar sem recorrência`;
- cores básicas quando oferecidas na configuração de local em Perfil.

### Exclusivo do Premium

- recorrência de trabalhos;
- visualização das próximas datas geradas pela recorrência;
- paleta ampliada e personalização da cor do local;
- gerenciamento da recorrência nos detalhes;
- acesso sem cadeado a `Repetir` e `Cor do local` durante edição.

### Comportamento do bloqueio no Free

- Mostrar uma prévia real das opções de recorrência, esmaecida.
- Explicar o benefício antes de oferecer Premium.
- Oferecer `Conhecer DOKH Premium`.
- Manter uma saída sem custo: `Continuar sem recorrência` ou `Usar cor automática`.
- Nunca impedir a criação do trabalho por causa de recorrência ou cor.
- Não abrir o paywall diretamente sem passar pelo fluxo de benefícios definido em Perfil.

## Recorrência Premium

Opções desenhadas:

- não repetir;
- toda semana;
- a cada duas semanas;
- todo mês;
- personalizar.

Ao selecionar uma frequência, mostrar as próximas datas geradas quando essa prévia existir. O design não define:

- data final;
- quantidade máxima de ocorrências;
- exceções;
- edição de uma ocorrência versus toda a série;
- conflitos de agenda.

Esses pontos permanecem como lacunas de especificação.

## Cor do local

### Premium

- Exibir oito cores dessaturadas da família visual DOKH.
- Mostrar o nome da cor selecionada.
- Exibir preview do ponto no calendário e do card.
- Salvar associa a cor ao local, não somente à ocorrência atual.

### Free

- Mostrar o benefício da personalização.
- Manter os locais com cor automática.
- A criação do trabalho continua normalmente.

## Detalhes do trabalho

Informações obrigatórias:

- data por extenso;
- local;
- início e término;
- tipo e duração;
- valor;
- previsão de entrada;
- status;
- recorrência, quando existir;
- ações `Editar trabalho` e `Excluir`.

Regras:

- Status usa ponto e texto, não badge chamativo.
- Usuária Premium com recorrência vê `Gerenciar`.
- `Editar trabalho` abre o mesmo formulário de criação, preenchido.
- `Excluir` é uma ação destrutiva; a confirmação posterior não está desenhada.

## Edição

- Reutilizar o formulário de criação.
- Pré-preencher todos os dados existentes.
- Calcular e exibir o término com base no início e na duração.
- No Premium, recorrência e cor aparecem sem cadeado.
- `Salvar alterações` persiste a nova versão.
- O comportamento sobre ocorrências futuras de uma recorrência não está definido.

## Cenários de dados na tela

| Dados disponíveis | Resultado esperado |
| --- | --- |
| Nenhum trabalho no dia | Mensagem de dia livre e CTA secundário. |
| Um trabalho | Um ponto no calendário e um card. |
| Vários trabalhos | Vários pontos quando aplicável e cards ordenados por horário. |
| Trabalho recebido | Check discreto e estado `Recebido`. |
| Pagamento previsto | Status com a data calculada. |
| Pagamento desconhecido | Trabalho salvo; valor encaminhado a Finanças como sem data. |
| Template conhecido | Formulário pré-preenchido e foco na nova data. |
| Recorrência Premium | Próximas datas geradas visíveis. |
| Free tentando recorrência | Explicação Premium e saída sem recorrência. |
| Free tentando cor personalizada | Explicação Premium e manutenção da cor automática. |

## Erros, pendências e lacunas

### Estados previstos pelo design

- Dia livre é estado vazio, não erro.
- Trabalho sem data de entrada é pendência, não erro.
- Trabalho passado sem confirmação não é marcado como recebido.
- Dia já ocupado é sinalizado por pontos, mas não gera bloqueio.

### Estados não especificados no design

Não há telas ou regras para:

- falha ao carregar mês ou trabalhos;
- falha ao salvar, editar ou excluir;
- conflito de concorrência entre edições;
- data/hora inválida ou duração igual a zero;
- valor inválido;
- recorrências sem fim, conflitantes ou parcialmente alteradas;
- local removido enquanto ainda possui trabalhos;
- confirmação de exclusão;
- modo offline, timeout ou tentativa novamente.

Não usar o estado de dia livre para representar erro de carregamento.
