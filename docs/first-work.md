# Primeiro Trabalho no onboarding — tarefa 7.4

Fontes: `design/onboarding.html` — TELA 06 (tipo), 19 (local), 20 (quando) e 22 (valor e previsão). Comportamento: `docs/screens/onboarding.md`. Escrita: RPC atômica da 3.7 pela camada das 6.1/6.2.

## Fluxo

`tipo → local → quando → valor` e, ao final, a gravação. A conclusão dinâmica e a marcação de `onboarding_completed_at` são a **7.5**; hoje o fluxo termina num destino provisório.

O tipo escolhido acompanha as telas seguintes como chip e decide o que é obrigatório:

| Tipo | Data | Horário e duração |
| --- | --- | --- |
| Plantão | obrigatória | **obrigatórios** |
| Procedimento | obrigatória | opcionais, atrás de `+ Adicionar horário` |
| Atendimento | obrigatória | opcionais, atrás de `+ Adicionar horário` |

Residência não aparece como tipo: é configurada no Perfil e gera Recebíveis próprios.

## Telas

- **Tipo (TELA 06)** reusa o `WorkTypeSelector` da 2.5. Quem tem residência vê a nota "aqui entram os trabalhos que você faz além dela".
- **Local (19)** pede só o nome. Campo, dica e botão ficam acima do teclado.
- **Quando (20)** reusa o `CalendarGrid` da 2.5 numa densidade `compact` (célula 38, círculo 32), com navegação de mês, linha `SELECIONADO`, horário de início (roda nativa numa folha com `Confirmar horário`; girar sem confirmar não grava) e duração em 6h, 12h, 24h ou Outro (stepper). O término é derivado (`workEndDescription`) e avisa quando cai no dia seguinte.
- **Valor (22)** usa o `MoneyInput` grande. A previsão termina sempre num estado conhecido: data por D30/D60/D90 (calculada a partir da data do trabalho), `Outra data` (calendário nativo da Apple numa folha, a partir da data do trabalho, gravado só ao confirmar) ou `Ainda não sei quando entra`, que grava sem data e explica que o valor aparecerá em Finanças como "sem previsão". Enquanto o teclado numérico está aberto, só o valor e o botão aparecem; sem previsão escolhida, o botão vira `Continuar` e apenas baixa o teclado. Tocar fora do teclado também o fecha.

## Gravação

`useSaveFirstWork` reaproveita o Local pelo nome (comparação sem acento/caixa) e só cria um novo quando não existir; depois chama a RPC atômica. A **chave de idempotência nasce na primeira tentativa e é reaproveitada no retry**, então erro de rede seguido de nova tentativa não cria dois Trabalhos. Sem atualização otimista: a tela só avança com a confirmação do servidor, e o rascunho é preservado em caso de erro.

## Limites

- Reutilizar um Trabalho conhecido (6.6), sheets dedicados de data/duração/pagamento (6.5) e preferências padrão (11.5) não entram aqui: o onboarding usa o caminho curto do HTML.
- Recorrência e cor de Local não aparecem no onboarding — são da Agenda (8.5/8.6).
- Validação em aparelho com Supabase local segue pendente.
