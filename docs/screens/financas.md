# UX — Finanças

## Escopo

Este documento descreve as telas financeiras representadas em `DOKH Financas.html` e o uso do Review Card de `DOKH Componentes.dc.html`. Os valores, meses, percentuais e fontes de renda apresentados nos layouts são exemplos.

## Objetivo da seção

Responder:

- quanto está previsto para entrar no mês;
- quanto já foi recebido e quanto ainda falta;
- qual é a próxima entrada;
- quais valores ainda não têm data;
- de onde vêm as entradas;
- quanto o trabalho realizado gerou;
- no Premium, como valor/hora, evolução e projeção estão se comportando.

## Regra central: caixa e competência

Os dois conceitos nunca devem ser misturados.

### Previsto para entrar — caixa

Considera pagamentos cuja data de entrada cai no período selecionado, independentemente da data em que o trabalho foi realizado.

Exemplo: trabalho realizado em agosto com pagamento em setembro entra no total de setembro.

### Trabalho gerado — competência

Considera trabalhos realizados no período selecionado, independentemente da data em que serão pagos.

Exemplo: trabalho realizado em setembro com pagamento em outubro entra em `Trabalho gerado` de setembro e em `Entradas` de outubro.

### Regras de cálculo exibidas

- `Recebido + A receber = previsto para entrar` no mês.
- Valores sem data de entrada ficam fora do total mensal.
- Valor/hora = valor gerado ÷ horas trabalhadas com duração registrada.
- Projeção anual Premium usa a média mensal para estimar os meses restantes.

## Estrutura da visão mensal

1. Mês/ano e navegação entre períodos.
2. Alternância `Mês` / `Ano`.
3. Total previsto para entrar no mês.
4. Objeto `Recebido × A receber` e percentual recebido.
5. Próxima entrada ou estado vazio correspondente.
6. Review Card de valores sem data, somente quando existirem.
7. Origem das entradas.
8. Trabalho gerado no mês.
9. Valor/hora e insight, conforme o plano.
10. Navegação principal.

## Cenários mensais

### Mês atual com dados

Informações obrigatórias:

- total previsto;
- recebido;
- a receber;
- percentual recebido;
- próxima entrada com data, origem e valor;
- acesso à lista de entradas;
- valores sem data, se existirem;
- composição/origem;
- trabalho gerado, quantidade de trabalhos e horas;
- valor/hora e insight conforme o plano.

### Mês sem valores sem data

- Remover completamente o Review Card de revisão.
- A seção seguinte sobe para ocupar o espaço.
- Não manter placeholder de `nenhuma pendência`.

### Tudo recebido e sem próxima entrada

- Mostrar o total integral em `Recebido`.
- Mostrar `A receber R$ 0` e `100% recebido`.
- `Próxima entrada` assume o estado `Nenhuma prevista`.
- Manter `Ver extrato do mês`; o histórico nunca depende de existir uma próxima entrada.

### Mês anterior fechado

- O app abre no mês atual.
- Setas permitem navegar para meses fechados.
- Em mês passado, o hero muda de `previstos para entrar` para o valor que `entrou` no mês.
- Marcar o período como fechado quando não houver pendência.
- A seta para o mês seguinte permanece disponível até retornar ao atual.

### Sem trabalhos

- Não exibir gráfico vazio nem cards com `R$ 0`.
- O hero usa `R$ —` e `nada registrado ainda`.
- Mostrar CTA `Adicionar trabalho`.
- Antecipar, em uma lista esmaecida, o que a seção passará a mostrar: a receber, recebido/faltante e trabalho gerado.

### Trabalhos com valor, mas sem data de entrada

- O hero usa `R$ —` e informa que nada está previsto para entrar.
- Barra tracejada representa valor existente sem data.
- `Próxima entrada` mostra `Nenhuma prevista` e mantém acesso ao extrato.
- Exibir Review Card com quantidade, total sem data, até dois previews e `+ N entrada(s)` para o restante.
- O CTA é `Adicionar datas`.
- O tom é convite à organização, não falha.
- `Trabalho gerado` continua disponível porque existe competência, mesmo sem caixa previsto.

### Primeiro mês / pouco histórico

- Mostrar somente os meses com dados.
- Informar que o histórico começa agora.
- Não calcular média mensal sem base suficiente.
- Não exibir `+0%`.
- Não inventar tendência, evolução ou comparação.

## Visão anual

### Informações base

- total recebido e previsto no ano;
- barras de janeiro a dezembro;
- indicação do mês atual;
- média mensal quando houver histórico suficiente;
- origem das entradas no ano;
- recursos Premium conforme o plano.

### Premium

- Exibir valores reais de origem.
- Exibir valor/hora médio no ano e evolução.
- Exibir projeção até dezembro.
- Na projeção, diferenciar linha realizada de linha pontilhada bronze para os meses estimados.
- Explicar a projeção com a média mensal usada e o valor calculado para os meses restantes.

### Free

- Manter barras e média mensal quando calculáveis.
- Manter a estrutura real das áreas avançadas.
- Ocultar números e percentuais de origem, valor/hora, evolução e projeção com marcadores `•••`.
- Explicar o benefício e oferecer `Desbloquear com Premium`.
- Não inventar números de demonstração dentro do estado bloqueado.

## Lista de entradas

### Estrutura obrigatória

- título `Entradas`;
- mês/ano e navegação anterior/próximo;
- resumo do período;
- timeline vertical;
- para cada item: dia, mês, origem, valor e status.

### Mês atual

- Resumo com recebido e a receber.
- Entradas recebidas usam dia esmaecido, ponto verde cheio e `Recebido`.
- Entradas futuras usam ponto vazado e `Previsto`.

### Mês passado

- Mostrar recebidos e confirmações pendentes.
- Uma data passada sem confirmação usa bronze, nunca vermelho.
- Oferecer ação inline `Você recebeu?`.
- Nunca confirmar automaticamente.

### Mês futuro

- Mostrar somente entradas previstas.
- Trabalhos de meses anteriores aparecem se o pagamento cair no mês futuro.
- Esses itens não contam como trabalho gerado do mês futuro.

### Mês vazio

- Não exibir ilustração nem `R$ 0`.
- Mostrar `Nada previsto por enquanto`.
- Explicar que entradas aparecerão quando houver uma data de pagamento.
- Manter a navegação de mês.

## Status de entrada

| Estado | Tratamento |
| --- | --- |
| Recebido | Check/texto verde, dia esmaecido e ponto cheio. |
| Previsto | Tratamento neutro, data ativa, ponto vazado e texto `Previsto`. |
| Confirmação pendente | Bronze, contexto da data e ação `Você recebeu?`. Não usar vermelho. |
| Sem data | Fora do total do mês; aparece em Review Card e fluxo de revisão. |

Ao confirmar uma entrada, o estado deve ser refletido no resumo, na timeline e em qualquer card correspondente. O design não especifica animação ou estratégia de atualização para essa tela.

## Free e Premium

### Disponível no Free

- total mensal previsto;
- recebido e a receber;
- percentual recebido;
- próxima entrada;
- extrato/lista de entradas;
- revisão de valores sem data;
- barras e média da visão anual quando houver dados;
- estrutura das seções avançadas com explicação do valor do Premium.

### Exclusivo do Premium

- números e percentuais detalhados da origem das entradas nos estados bloqueados desenhados;
- trabalho gerado com métricas avançadas quando o design as oculta;
- valor/hora mensal e anual;
- evolução do valor/hora;
- insights com números reais;
- análise completa de valor/hora;
- projeção anual numérica.

O texto introdutório do design diz que `Free organiza, Premium interpreta`. Nas telas Free, a composição/origem permanece visível como estrutura, mas seus números aparecem ocultos com CTA Premium. Este documento adota esse comportamento visual e não considera os números de composição liberados no Free.

### Teasers Premium

Os designs apresentam três formas válidas de explicar valor antes do fluxo Premium:

- fórmula de valor/hora visível, resposta oculta;
- gráfico histórico com estrutura real e valores ocultos;
- conclusão qualitativa do insight visível, números ocultos.

Regras:

- usar um objeto coerente com o conteúdo real;
- não preencher com dados falsos;
- usar `Premium` de forma discreta;
- CTA encaminha para o fluxo de benefícios Premium, não diretamente para compra.

## Análise completa de valor/hora — Premium

Destino de `Ver análise completa`.

Informações obrigatórias:

- período;
- trabalho gerado;
- quantidade de trabalhos;
- horas trabalhadas;
- fórmula de valor/hora;
- resultado do período;
- série histórica mensal;
- comparação/evolução somente quando sustentada pelos dados.

A tela é a própria análise. Não deve adicionar CTAs operacionais que não aparecem no design.

## Folhas explicativas

Os ícones de informação abrem bottom sheets para explicar:

- previsto para entrar;
- recebido;
- a receber;
- trabalho gerado;
- valor/hora.

Cada folha deve conter rótulo, valor contextual, explicação simples e exemplo concreto. A folha de valor/hora no Free mostra o resultado oculto, explica a fórmula e oferece Premium.

## Review Card financeiro

- Contexto e contagem em label curta.
- Valor principal antes da explicação.
- No máximo dois previews.
- Acima de dois itens, usar `+ N entradas`.
- O card inteiro abre a lista de entradas sem data.
- A faixa inferior repete a ação.
- Resolver a pendência remove o card.
- Nunca usar vermelho ou ícone de erro para dado incompleto.

## Cenários de dados na tela

| Dados disponíveis | Resultado esperado |
| --- | --- |
| Caixa e competência completos | Todas as seções aplicáveis, com plano determinando os detalhes avançados. |
| Tudo recebido | `100% recebido`, `A receber R$ 0`, estado vazio de próxima entrada e acesso ao extrato. |
| Valor sem data | Excluído do total mensal; incluído no Review Card e em trabalho gerado. |
| Sem trabalhos | `R$ —`, CTA de cadastro e preview educativo. |
| Trabalhos somente sem data | `R$ —` no caixa, Review Card e competência preservada. |
| Primeiro mês | Uma barra, sem média ou tendência. |
| Mês passado | Valor que entrou e indicação de mês fechado. |
| Mês futuro | Entradas previstas pelas datas de pagamento. |
| Free | Dados organizacionais visíveis; números interpretativos bloqueados conforme telas. |
| Premium | Números, análises, insights e projeções liberados. |

## Erros, pendências e lacunas

### Estados previstos pelo design

- Sem data de entrada é pendência, não erro.
- Confirmação atrasada é pendência, não perda financeira.
- Ausência de histórico impede média e tendência; não é substituída por zero.
- Mês vazio usa mensagem específica, não `R$ 0`.

### Estados não especificados no design

Não há telas ou regras para:

- falha de cálculo ou divergência entre totais;
- falha ao carregar mês, ano, timeline ou insight;
- falha ao confirmar recebimento;
- atualização concorrente de uma entrada;
- moeda diferente de real;
- estorno, entrada parcial, perda, imposto ou custo;
- projeção impossível por dados insuficientes além do primeiro mês mostrado;
- modo offline, timeout, skeleton ou tentativa novamente;
- erros de assinatura ao abrir conteúdo Premium.

Falha de carregamento não deve ser apresentada como mês vazio, `R$ —` ou ausência de histórico.
