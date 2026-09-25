# UX — Home

## Escopo

Este documento descreve a Home representada em `DOKH Home.html` e os comportamentos compartilhados do Review Card documentados em `DOKH Componentes.dc.html`. Os nomes, valores, locais e datas dos layouts são exemplos de dados.

## Objetivo da seção

Responder rapidamente:

- quanto está previsto para entrar no mês selecionado;
- qual é o próximo trabalho;
- se existe alguma ação financeira pendente;
- quais são as próximas entradas e os próximos trabalhos;
- se ainda falta alguma etapa para a DOKH ficar completa.

A Home resume e encaminha. Listas completas e edição pertencem às seções de destino.

## Estrutura obrigatória

O topo verde (header e hero) e todas as seções sobre fundo bege pertencem à **mesma rolagem vertical**. Ao deslizar para baixo na página, o topo verde também sobe e sai da área visível; não é um header fixo nem uma lista aninhada sob um hero imóvel. A barra inferior de navegação permanece fora dessa rolagem. O carrossel horizontal do hero não deve bloquear o gesto vertical da página.

1. Header com marca, avatar/inicial e hero mensal.
2. Carrossel do hero quando houver histórico suficiente.
3. Próximo trabalho ou estado vazio correspondente.
4. Review Card somente quando houver ação pendente.
5. Próximas entradas, quando existirem.
6. Próximos trabalhos, quando existirem.
7. Progresso de configuração, somente enquanto ainda fizer sentido.
8. Navegação principal: Início, Agenda, ação central `+`, Finanças e Perfil.

## Hero mensal

### Página 1 — visão do mês

Deve conter:

- saudação com mês e primeiro nome;
- mês/ano selecionado e controles anterior/próximo;
- valor previsto para entrar no mês;
- qualificador do valor;
- comparação com o mês anterior somente quando houver base real.

### Página 2 — histórico

Quando houver histórico, deve mostrar:

- meses em sequência;
- valor de cada mês;
- mês atual destacado;
- quantidade de entradas previstas, quando aplicável.

O gráfico é simples, sem eixos. Meses históricos usam sálvia e o mês atual usa bronze.

### Comportamento do carrossel

- A altura do hero não muda ao alternar as páginas.
- Swipe horizontal e o controle de paginação alternam a página.
- A transição desenhada dura 450 ms; as barras crescem a partir da base em 400 ms.
- O conteúdo creme abaixo do hero não se move durante a troca.
- Sem histórico, existe apenas a página 1 e o indicador de duas páginas não deve aparecer.

## Cenários e estados

### Estado padrão com dados

Informações obrigatórias:

- total previsto no mês;
- próximo trabalho com relação temporal/data, horário, local, tipo, duração, valor e previsão de entrada quando existentes;
- próximas entradas com data, origem/local e valor;
- próximos trabalhos em ordem cronológica;
- links para os destinos completos.

Comportamentos:

- tocar no próximo trabalho abre seus detalhes;
- `Ver todas as entradas` abre a lista de entradas em Finanças;
- `Ver agenda` abre a Agenda;
- o mês pode ser alterado pelo header.

### Primeiro acesso

- Exibir hero de página única, pois ainda não há histórico.
- Mostrar o total e a contagem disponíveis sem criar comparação.
- Não mostrar Review Card quando não há ação pendente.
- Mostrar o progresso de configuração enquanto houver passos úteis.

### Entrada prevista para hoje

- Exibir um Review Card em tom de atenção acima das listas passivas.
- Mostrar origem, trabalho relacionado, valor e ação `Você recebeu?`.
- A entrada de hoje não deve ser duplicada em `Próximas entradas`.
- Ao confirmar, o estado muda brevemente para `Recebido` e o card sai da área de ações com uma transição curta.
- A confirmação deve refletir nas demais áreas que exibem a mesma entrada.

### Entrada vencida sem confirmação

- Nunca marcar como recebida automaticamente.
- Exibir Review Card neutro com a data prevista, origem, valor e `Confirmar entrada`.
- Tratar como pendência, não como erro.

### Mês sem entradas

- Não exibir `R$ 0,00`.
- Mostrar `Nenhuma entrada prevista ainda` e uma explicação operacional.
- Oferecer `Adicionar trabalho`.
- Se houver valor sem data, mostrar Review Card de revisão.
- O próximo trabalho e a lista de trabalhos continuam aparecendo se existirem.
- Não mostrar progresso de configuração quando o setup já estiver concluído.

### Sem próximo trabalho

- Manter a visão financeira existente.
- Substituir o card do próximo trabalho por um estado vazio tipográfico.
- Exibir `Adicionar trabalho` como ação.
- Não usar ilustração nem valor fictício.

### Sem histórico

- Remover a página histórica do hero.
- Não mostrar variação percentual, comparação ou gráfico vazio.

## Review Cards e ações pendentes

O componente compartilhado segue estas regras:

- Pendência não é erro: não usar vermelho nem ícone de alerta.
- O valor aparece antes da explicação.
- O card inteiro é clicável; a faixa de ação repete o mesmo destino.
- Um preview mostra no máximo dois itens; acima disso, resumir como `+ N entradas`.
- Previews só aparecem quando ajudam a decidir.
- A versão compacta não contém bandeja de preview.
- No máximo dois Review Cards devem ficar visíveis na Home.
- Apenas um Review Card por tela pode usar tom de atenção.
- Quando a pendência é resolvida, o card sai da tela; não permanece ocupando espaço como concluído.

Aplicações previstas na Home:

- confirmar entrada de hoje;
- completar cadastro de trabalho;
- revisar valores sem data;
- completar um passo simples do setup.

## Progresso de configuração

Quando o setup ainda não estiver completo:

- mostrar quantidade concluída, quantidade total e barra proporcional;
- listar passos concluídos com check;
- apresentar a próxima ação disponível;
- explicar quantos passos faltam.

Quando o setup estiver concluído, o objeto deixa de existir. Ele não deve virar um card de `100% concluído` permanente.

## Free e Premium

As telas da Home não identificam nenhum conteúdo como exclusivo do Premium e não apresentam uma variação específica por plano.

Portanto:

- todos os estados descritos neste arquivo devem permanecer disponíveis no plano Free;
- a Home não deve esconder o histórico, as próximas entradas ou as ações de confirmação por causa do plano;
- não deve ser adicionado paywall à Home sem nova definição de produto/design.

Recursos Premium de Finanças e Agenda continuam sujeitos às regras das respectivas seções, mesmo quando acessados a partir da Home.

## Informações obrigatórias por objeto

### Próximo trabalho

- relação temporal ou data;
- horário, quando cadastrado;
- local;
- tipo;
- duração, quando cadastrada;
- valor;
- previsão de entrada ou `Entrada a definir`.

### Próxima entrada

- data prevista;
- origem/local;
- valor;
- cor de referência do local/tipo como apoio, nunca como única identificação.

### Próximo item da agenda

- dia e mês;
- local;
- horário/período;
- duração, quando cadastrada;
- valor.

### Hero

- mês e ano;
- total ou mensagem vazia;
- qualificador correto do total;
- comparação somente quando calculável.

## Cenários de dados na tela

| Dados disponíveis | Exibição esperada |
| --- | --- |
| Entradas, trabalhos e histórico | Hero com duas páginas, próximo trabalho, listas e comparações válidas. |
| Entradas e trabalhos, sem histórico | Hero de uma página, sem gráfico e sem comparação. |
| Entrada com data hoje | Review Card de confirmação; item removido da lista passiva para evitar duplicidade. |
| Entrada com data passada e sem confirmação | Review Card neutro; estado continua não recebido. |
| Trabalho com valor, mas sem data de entrada | Review Card `sem data prevista`; valor não recebe data inventada. |
| Nenhuma entrada no mês | Mensagem vazia no hero, sem `R$ 0,00`; CTA para adicionar trabalho. |
| Nenhum próximo trabalho | Estado vazio do card; dados financeiros preservados. |
| Setup incompleto | Card de progresso com a próxima ação. |
| Setup completo | Card de progresso ausente. |
| Lista longa | A Home mostra somente o recorte previsto pelo design e encaminha para a lista completa. A quantidade exata do recorte não está especificada como regra. |

## Erros, pendências e lacunas

### Estados previstos pelo design

- Pagamento não confirmado após a data é uma pendência, não um erro.
- Trabalho sem data de entrada é um dado incompleto, não uma falha.
- Mês vazio e ausência de próximo trabalho são estados operacionais, não erros.

### Estados não especificados no design

Não há telas ou regras para:

- falha ao carregar dados da Home;
- falha ou conflito ao confirmar recebimento;
- atualização otimista e rollback;
- modo offline;
- skeleton, spinner, timeout ou tentativa novamente;
- mês parcialmente carregado;
- valores indisponíveis por erro de cálculo;
- avatar ou nome ausente.

Esses casos devem ser tratados como lacunas de especificação. Não usar o estado vazio para mascarar falha de carregamento.
