# Card de Trabalho — recorte da tarefa 2.5

Fontes visuais: `design/agenda.html` (quadros 02, 03 e 05) e `design/home.html` (quadros 01 e 03). Fontes de comportamento: `docs/screens/agenda.md`, `docs/screens/home.md` e o agregado Trabalho em `domain-model.md`. Os nomes, datas e valores dos quadros só aparecem em `/dev/primitives`, não nas telas de produto.

`WorkCard` tem três apresentações do mesmo Trabalho:

- `agenda`: superfície 22, barra lateral de 4 pontos com cor do Local, horário quando existente, tipo/duração, local, valor e estado do Recebível. O card inteiro abre detalhes. Múltiplos cards seguem a ordem fornecida pela query (horário nulo por último); o componente não ordena nem persiste dados.
- `featured`: próximo trabalho da Home com relação temporal, horário se cadastrado, local, tipo/duração, valor e previsão de entrada. Sem horário, não inventa `00:00`; sem data de entrada, a feature fornece o rótulo operacional válido.
- `row`: item compacto da lista de próximos trabalhos na Home, com barra de 5 pontos, dia/mês, local, horário/duração quando existem e valor. O tipo também integra o nome acessível; a cor nunca é a única pista.

As cores `sage`, `bronze`, `blue`, `green`, `terra` e `violet` mapeiam os tokens de Local desenhados no seletor de cor da Agenda; o componente não aceita hexadecimal arbitrário. A fonte de verdade do Local e do Recebível permanece no servidor. O estado `received` só aparece quando a feature passar a confirmação derivada de `received_at`; datas passadas não o ativam sozinhas. Os demais estados mantêm texto neutro, sem vermelho.

Há uma divergência: `Agenda 05` desenha “Recebido” em uma cápsula suave, mas `docs/screens/agenda.md` exige check e texto discretos **sem badge**. A regra de UX tem precedência; o componente mostra check e texto sem superfície de cápsula. As sombras nativas aproximam o CSS, sem reproduzir o brilho inset. Fontes, cores, medidas e amostras restantes seguem os HTMLs.

Testes cobrem os três layouts, estados de pagamento, ausência de horário fictício, mapeamento de cor, alvo único de 44 pontos e catálogo. A 2.5 ainda exige os oito componentes restantes e integração real; inspeção visual/VoiceOver e Android/TalkBack poderão ocorrer depois sem impedir o trabalho independente. O checkbox continua desmarcado.
