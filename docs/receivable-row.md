# ReceivableRow — recorte da tarefa 2.5

Fontes: `docs/screens/financas.md`, `design/financas.html` (Entradas 05–10), `domain-model.md` e `decisions.md`. Os exemplos do catálogo são demonstrações, não dados persistidos. O HTML de referência não foi alterado.

## Contrato

- Recebe uma projeção de Recebível com data, origem e valor já formatados pelo chamador. Não calcula caixa, competência, valor/hora ou status; a feature deriva o status de `expected_on`, `received_at`, `invalidated_at` e data local segundo o domínio.
- Estados datados aceitos: `received`, `scheduled`, `due_today`, `confirmation_pending`. `undated` aparece no Review Card, fora da lista mensal; `invalidated` não é projetado.
- O estado `received` esmaece o dia, preenche o ponto verde e apresenta check/status verde. `scheduled`/`due_today` conservam ponto vazado e status neutro. `confirmation_pending` usa bronze, painel de atenção e ação separada “Você recebeu?”; não usa vermelho.
- O toque no item abre seu detalhe. A confirmação é um segundo controle acessível de no mínimo 44 pontos; `onConfirm` não muda o rótulo localmente. O chamador bloqueia o controle com `confirming` durante a mutation e só muda o status após sucesso do servidor. Falha mantém o Recebível pendente; sem confirmação automática ou otimista.
- `day`, `month`, `origin` e `value` são strings apresentacionais, não uma segunda fonte de verdade. Um Recebível da Residência usa a mesma linha; não cria Trabalho na Agenda.

## Geometria

O quadro 414 do HTML usa coluna de data 44, intervalo 16, linha de timeline 1, ponto 10 a 8 do topo, dia Archivo 600/22, mês Plex 9 e origem/valor Archivo 600/16. O painel pendente usa raio 18, fundo `#E4D9C2`, borda bronze translúcida, padding 14×16, ação com círculo de 34 e alvo mínimo de 44. Valores em `receivableRowMetrics` e `colors` mantêm as medidas e cores do HTML. O componente ocupa a largura disponível da tela, como a lista original.

## Limites deste recorte

A tela Entradas completa, navegação entre meses, resumos de caixa, query/mutation atômica e integração com Home virão nas tarefas próprias. A 2.5 permanece desmarcada até todos os dez componentes estarem reproduzidos, catalogados, testados e visualmente conferidos no device. Android/TalkBack foi adiado pelo usuário, não removido da DoD.
