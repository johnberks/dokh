# Conclusão do onboarding (7.5)

TELA 10 de `design/onboarding.html` e linha "Conclusão" de `docs/screens/onboarding.md`.

## O que mostra

Só o que foi **gravado no servidor**, não o rascunho local (`src/features/onboarding/onboarding-summary.ts`):

- a bolsa ativa em `residencies` — só existe para quem faz residência;
- o primeiro Trabalho, lido em `agenda_work_projection` pelo `workId` que a tela de valor passa na rota (`/first-work-done?workId=`).

| Dado | Regra |
| --- | --- |
| Total `PREVISTO PARA ENTRAR` | Soma da bolsa mensal e do valor do Trabalho; a contagem acompanha ("de 1 entrada" / "de 2 entradas") |
| Card de residência | Só com residência; especialidade, `todo dia DD` e valor |
| Card do Trabalho | Tipo, local, `12 SET · 19:00 · 12h` — horário e duração só quando existem — e valor |
| Previsão | `Previsto para entrar` + `20 SET` em bronze, ou `Sem previsão de entrada`; nunca data fictícia |

Valores inteiros aparecem sem `,00` (`formatCentsToBRL(…, { omitZeroCents: true })`), como no design. O ano só aparece numa data quando difere do ano corrente.

## Conclusão do onboarding

- `onboarding_completed_at` é gravado **ao abrir a tela**, e só se ainda estiver vazio. Fechar o app aqui não reabre o onboarding — refazê-lo gravaria um segundo Trabalho.
- A Home só assume quando a pessoa toca em `Ir para o início`: a tela atualiza o cache de `onboarding-status`, limpa os rascunhos de perfil e Trabalho e navega para `/`.
- Se a marcação falhar, a tela avisa e o botão tenta de novo antes de sair.
- Não há volta: a tela de valor sai da pilha (`router.replace`), o gesto de voltar fica desligado e o voltar do Android é ignorado.

## Lacunas

- O design não define estado de carregamento nem de erro; a tela usa um indicador simples e uma mensagem com `Tentar novamente` no fundo escuro.
- A contagem trata a bolsa como uma entrada (a mensal), como no exemplo do HTML (R$ 3.654,42 + R$ 1.200 = R$ 4.854,42 "de 2 entradas").
