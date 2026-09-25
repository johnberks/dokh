# Formulário de Trabalho — tarefas 6.3 a 6.6

Agenda 06, 06B, 07, 08, 09 e 10 de `design/agenda.html`; regras de `docs/screens/agenda.md`.

## Fluxo

`+` central (e, na Fase 8, o `+` da Agenda) abre o mesmo fluxo, que depende do histórico (pedido do usuário, 2026-09-25):

- **Sem nenhum Trabalho**: abre direto na escolha do tipo (Plantão, Procedimento, Atendimento) em tela cheia — não há o que reutilizar.
- **Com histórico**: **06 Adicionar trabalho** com `USAR NOVAMENTE` (até 3 templates) e `Criar novo trabalho`, que abre a folha **06B** de tipo.

Nos dois casos, `WorkTypeSelector` em modo menu (Residência nunca aparece) leva ao **07 Novo trabalho**.

## Usar novamente (6.6) — `src/features/work/work-templates.ts`

- Templates são **derivados do histórico**, sem tabela própria: combinações distintas de Local, tipo, horário, duração e valor, da mais recente para a mais antiga (`agenda_work_projection`, até 200 Trabalhos). Locais arquivados ficam de fora.
- Card: ponto na cor do Local, nome, `Plantão · 12h · R$ 1.200` e o último horário.
- Escolher um template preenche tudo menos a data e abre direto a folha de data ("quando será?"). O formulário continua inteiro para revisão antes de salvar.
- A previsão acompanha: prazo D30/60/90 do último Trabalho é reaplicado sobre a nova data; "sem previsão" continua "sem previsão"; data específica não se repete (a pessoa escolhe de novo).

- Código: `src/features/work/form/` (`NewWorkFlow`, `WorkForm`, folhas e peças). Rota: `app/work/new.tsx` (modal).
- O rascunho é `useNewWorkDraft`, separado do rascunho do onboarding (`useWorkDraft`). Abrir o fluxo, voltar do formulário ou fechar limpa o rascunho.
- A gravação é a mesma do onboarding, generalizada em `useSaveWork(store)`: reaproveita Local pelo nome (sem acento/caixa) ou cria por RPC, e grava Trabalho + Recebível pela RPC atômica com chave de idempotência reaproveitada no retry.

## Formulário (07)

| Campo | Comportamento |
| --- | --- |
| Local | Digitado. Com foco, sugere até 4 Locais já usados; escolher fecha o teclado. Nome novo é criado ao salvar, com cor automática — o ponto do campo mostra a cor que ele terá. |
| Data | Folha 08: calendário da Agenda com pontos (até 3 por dia, na cor do Local) dos dias já ocupados. Ocupado não bloqueia. `Confirmar · 14 SET, SEG`. |
| Início | Folha com a roda nativa; obrigatório em Plantão, `Opcional` nos demais (com `Remover horário`). |
| Duração | 6h, 12h, 24h ou `Outro` (folha 09, stepper de 1 a 24 h). O término é calculado e mostra a data quando cruza a meia-noite (`Termina às 07:00 · 13 SET`). Obrigatória só em Plantão. |
| Valor | `MoneyInput` do formulário; vira centavos só ao salvar. |
| Previsão | Folha 10: `Em uma data específica` (calendário nativo, a partir da data do trabalho), 30/60/90 dias com a data calculada ao lado, ou `Ainda não sei`. Só abre depois da data. Mudar a data do trabalho recalcula um prazo D30/60/90 já escolhido. |

`Salvar trabalho` fica desabilitado até existir local, data e valor — e, em Plantão, início e duração. Salvar fecha o modal.

A tela rola como um todo (sem barra visível), com campo e botão acima do teclado e respiro de `KEYBOARD_CTA_GAP`; tocar fora ou arrastar fecha o teclado.

## Decisões e lacunas

- **Previsão não escolhida grava "sem previsão"** (`expected_on = null`): o design só exige data e valor para salvar, e "sem previsão" é um estado válido em Finanças.
- **`Repetir` e `Cor do local`** (linhas Premium da 07, folhas 11–14) entram com a recorrência e a cor Premium (8.5/8.6). Não aparecem ainda para não exibir controles sem efeito.
- O calendário da folha 08 começa no domingo, como no design; o início de semana configurável é da 8.1.
- O design não desenha escolha de Local em lista; o campo digitado com sugestões segue o padrão já aprovado no onboarding.
- Após salvar, o modal fecha; a lista do dia na Agenda chega na 8.1/8.2.
