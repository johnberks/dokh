# Ilustrações — cards, vazios e erros

Fonte: `design/ilustracoes.dc.html` (Claude Design, "DOKH Ilustracoes" V1). Traço em tinta 2,5, papel `#EDEAE0`, papel escuro `#D9D5C7` e um único toque de ouro; quadro 160×120, usado de 64 a 200 px. Tokens em `illustration` (`src/theme/tokens.ts`); componente `src/components/Illustration.tsx`, sempre decorativo (escondido do leitor de tela).

| # | Ilustração | `name` | Onde aparece |
| --- | --- | --- | --- |
| 01 | Agenda sem plantões | `emptyAgenda` | Dia livre da Agenda (`EmptyState agendaDay`), à direita do texto |
| 02 | Primeira entrada | `firstEntry` | Card de próximo trabalho da Home quando ainda não há nenhum trabalho |
| 03 | Carteira vazia | `emptyWallet` | Finanças sem trabalhos (mês e ano, `financesNoWork`) |
| 04 | Próximo plantão | `nextShift` | Card de próximo trabalho da Home quando não há trabalho futuro |
| 05 | Extrato sem lançamentos | `emptyStatement` | Entradas do mês vazias (`entriesMonth`), vazio centralizado |
| 06 | Tudo em dia | `allClear` | Finanças sem próxima entrada prevista (`financesNextEntry`) |
| 07 | Pagamento pendente | `paymentPending` | Próxima entrada no dia previsto/atrasada, esperando "Você recebeu?" |
| 08 | Sem conexão | `offline` | `LoadError` quando o `onlineManager` (NetInfo) diz offline |
| 09 | Algo deu errado | `error` | `LoadError` nos demais casos |
| 10 | Recurso Premium | `premium` | Origem das entradas bloqueada no Free (mês e ano) |

Regras do design:

- **Card** (Home, Agenda, Finanças): 88×66, sem sombra no chão (`ground={false}`), ao lado do texto.
- **Vazio/erro**: 140–180 px, com a sombra no chão, centralizado acima do título.
- Locais e Residência vazios do Perfil não têm ilustração no V1.
