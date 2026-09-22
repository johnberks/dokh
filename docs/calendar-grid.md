# CalendarGrid — tarefa 2.5 (recorte)

Fontes visuais: `design/agenda.html` — Agenda 01–05 (visão mensal) e Agenda 08 (bottom sheet "Quando será?"), que usam **o mesmo calendário**. Comportamento: `docs/screens/agenda.md` (Regras do calendário, Seleção de data). Decisões: D37 (`date-fns` para aritmética, `Intl` para formatação) e D39 (início da semana Domingo/Segunda).

- Lógica pura em `src/domain/calendar.ts`: `buildMonthGrid(month, weekStartsOn)` devolve semanas de 7 células (vazias antes do dia 1 e depois do último), 4 a 6 linhas; `weekdayOrder`, `shiftMonth` (atravessa o ano), `isLocalDate`/`isLocalMonth` estritos e `compareLocalDates`. Datas são strings locais `YYYY-MM-DD`, como `work_date` e `expected_on`; o cálculo usa meio-dia local para nenhum fuso deslocar o dia. Testado em fusos de −11 h a +14 h.
- Visual (tokens `calendarMetrics`): cabeçalho IBM Plex Mono 10 com iniciais pt-BR; célula de 46 de altura; círculo de 36; número Archivo 16 tabular — Medium nos dias comuns, SemiBold em hoje e selecionado (arquivos de fonte próprios, sem negrito sintético).
- Estados: **hoje** = contorno bronze 1,5; **selecionado** = círculo verde escuro com número creme (vence hoje); **passado** = `#8A9184`; futuro = verde escuro. Pontos de 5 com gap 3, um por Trabalho na cor do Local (`WorkLocationColorToken`); até 4 visíveis.
- Acessibilidade: cada dia é um botão (alvo ≥ 44) com rótulo por extenso via `Intl` — ex.: "quinta-feira, 10 de setembro, hoje, 1 trabalho" — e `selected` anunciado. O cabeçalho de iniciais fica oculto do leitor de tela, porque cada dia já diz o dia da semana. Cor nunca é a única informação.
- Contrato: o componente não lê o relógio (`today` vem da feature, no fuso do usuário), não soma valores, não bloqueia dias ocupados e não navega de mês — o cabeçalho "Setembro 2026" com ‹ › pertence à tela/sheet. Sem `onSelectDate` é só leitura.
- Catálogo `/dev/primitives`, seção **Calendário**: Agenda 01 (Domingo) e Agenda 08 (Segunda) com os dados do HTML.

Os HTMLs de referência não foram alterados. Inspeção visual/VoiceOver no iPhone e Android/TalkBack seguem pendentes pela DoD geral da 2.5.
