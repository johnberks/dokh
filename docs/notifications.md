# Lembretes (12.1, 12.3, 12.4)

Pedido do usuário em 2026-10-03, para o grupo de testes com amigos: lembretes **ligados por padrão**, como combinado no roadmap e como no design Perfil 14, e uma seção no Perfil para desligar ou personalizar.

## Como funciona (D80)

- **Avisos locais** (`expo-notifications`), agendados no aparelho a partir dos dados do servidor. Não há push pelo servidor por enquanto: sem chave APNs nem job, e funciona offline. O push (12.2) entra quando houver necessidade entre aparelhos (D53).
- **`NotificationSync`** (no layout raiz) refaz o plano e **substitui** tudo o que está agendado. Recriar do zero evita lembrete órfão. Isso acontece:
  - ao abrir o app e ao voltar para ele (as leituras revalidam no foco);
  - depois de qualquer escrita de Trabalho ou Recebível (a chave `reminderSources` usa o prefixo `finance-month`, invalidado a cada escrita);
  - ao mudar as preferências.
  
  Um plano igual ao último não reagenda nada.
- **Sair da conta** cancela tudo. A exclusão de conta também, porque termina em logout.
- **Janela:** entradas dos próximos 60 dias e Trabalhos dos próximos 30. No máximo 60 avisos, porque o iOS guarda 64. Quem fica muitas semanas sem abrir deixa de receber os mais distantes, e a tela avisa isso.
- **Build anterior ao `expo-notifications`:** `notifications-module.ts` só carrega a biblioteca se o nativo existe. Sem ele, a DOKH segue igual, só sem lembretes, e a permissão aparece como "indisponível".

## O que é avisado (`reminder-plan.ts`)

| Lembrete | Quando | Texto | Ao tocar |
| --- | --- | --- | --- |
| **Entrada no dia previsto** | no dia previsto, no horário escolhido (padrão 8h, no fuso da pessoa). Várias entradas no mesmo dia viram um aviso só, somado. A bolsa da residência participa. Só `scheduled`/`due_today`: recebido, pendência passada e invalidado ficam de fora | "Hoje entra R$ 1.200 / De Hospital São Lucas. Você recebeu? Toque para confirmar." | uma entrada de Trabalho abre o detalhe (com "Marcar como recebido"); várias, ou a residência, abrem Entradas do mês |
| **Próximo trabalho** | com horário: início menos a antecedência (30 min, 1 h, **2 h**, 1 dia), no fuso do Trabalho. Sem horário: 8h do dia, ou 20h da véspera com 1 dia | "Plantão em 2 horas / Hospital São Lucas, às 19:00." | o Trabalho |
| **Trabalhos sem data de entrada** | toda segunda às 9h, só se existir algum | "3 trabalhos ainda sem previsão de pagamento…" | Início |

Nada no passado é agendado (por exemplo, o aviso das 8h de hoje se o app abriu às 10h).

## Preferências (`notification_preferences`)

- Migration `20261003000000_notification_reminders`:
  - os três lembretes passam a nascer ligados;
  - as linhas existentes (só seed e testes, porque não havia tela) foram ligadas;
  - campos novos `receivable_due_time` (padrão 08:00, entre 05:00 e 22:00, sem segundos) e `work_reminder_minutes` (30, 60, 120 ou 1440; padrão 120).
- Rollback e teste em banco descartável: `scripts/test-migration-12.sh`, que faz parte de `npm run test:db`.
- Sem linha gravada, o app usa os padrões (todos ligados). Cada mudança na tela grava na hora (upsert). Em erro, a tela volta ao que está gravado e avisa.
- **"Alterações importantes"** (Perfil 14) ficou fora: o evento não tem definição de produto, e a coluna segue desligada e sem uso. Volta quando for definido.

## Permissão (D52)

- A preferência e a permissão do sistema são estados separados. Negar no iPhone **não** desliga nenhuma preferência.
- **Convite** (`NotificationPrompt`, nas abas; referências Mobbin: Givingli, Remote):
  - folha com ilustração, "Ativar lembretes" (pede ao sistema) e "Agora não";
  - aparece uma vez, com a permissão ainda não pedida e fora do guia de primeiro uso;
  - a resposta fica no aparelho (`SecureStore`, estado de interface).
- **Perfil › Notificações:** permissão negada mostra um cartão com "Abrir Ajustes"; não pedida, "Permitir notificações". A linha do Perfil mostra "Ligadas" ou "Desligadas".

## Tela Perfil › Notificações (`NotificationsScreen`, rota `/profile/notifications`)

Perfil 14 tem dois grupos com toggle e subtexto:
- **Entradas:** "Lembrar no dia previsto" (com os horários 7h, 8h, 9h e 12h abaixo, quando ligado) e "Trabalhos sem data de entrada";
- **Agenda:** "Lembrete de próximo trabalho" (com a antecedência abaixo, quando ligado).

A personalização logo abaixo do toggle segue Craft e Tiimo (Mobbin).

## Build

`expo-notifications` é nativo: precisa de **novo build** de desenvolvimento e de produção. Avisos locais não precisam do plugin nem do entitlement de push. O plugin entra com o push (12.2). A Apple pode mandar um aviso por e-mail (ITMS-90078) por haver APIs de push no binário sem o entitlement; não bloqueia o envio.

## Testes

- `reminder-plan.test.ts`:
  - horário e fuso, soma por dia e residência;
  - antecedências, trabalho sem horário e semanal;
  - preferências desligadas, passado e limite de 60.
- `zoned-time.test.ts`: São Paulo, virada de mês, horário de verão e fuso inválido.
- `scheduler.test.ts`:
  - build sem o nativo;
  - gatilhos de data e semanal;
  - sem reagendar o mesmo plano;
  - cancelamento e permissões.
- `notifications-ui.test.tsx`:
  - tela: padrões, gravar, personalizar, erro e permissão negada;
  - convite: uma vez, fora do guia;
  - sincronização: agenda, sair cancela, sem permissão não lê;
  - toque, incluindo o que abriu o app.
- `profile.test.tsx`: a linha Notificações.
