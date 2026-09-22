# Navegação compartilhada — tarefa 2.4 (parcial)

Referências visuais: `design/home.html`, `design/agenda.html`, `design/financas.html` e `design/perfil.html`, nos quadros de 390×844. Comportamento: `docs/screens/home.md`, `agenda.md`, `financas.md` e `perfil.md`; decisões D03, D14–D17.

## Barra inferior

- Fundo creme `#EDEAE0`, borda superior de 1 ponto com verde-base a 10% de opacidade, padding horizontal 20, superior 10 e inferior 28 no quadro. No device, o padding inferior cresce até o inset seguro quando ele for maior.
- Ordem: Início, Agenda, ação central `+`, Finanças, Perfil. A ação central abre `/work/new` e não é uma tab selecionável. Deep link `/create` continua redirecionando para o mesmo fluxo.
- Ícones Lucide 22 pontos, traço 1,7; caixa ativa 40×30 com verde-base a 8%; rótulos IBM Plex Mono 9/12, tracking 1,08, peso 400 inativo e 600 ativo. Cores: verde-base ativo, sálvia inativo. Alvos das tabs têm no mínimo 44 pontos de altura.
- Ação central circular 56×56, elevada 30 pontos, fundo verde-base e `+` bronze 18 pontos/traço 2. Seu alvo acessível é 56×56.
- As telas usam o indicador home e a status bar **nativos** do sistema, nunca as barras falsas de 9:41 desenhadas nos mockups.

## Controle de volta/fechamento

O modal de adicionar Trabalho segue o cabeçalho de `Agenda 06`: controle circular visível de 40 pontos em alvo de 44, margem superior de 20 e horizontal de 24; título Archivo 600 de 30/32 e descrição Archivo 400 de 15/22. `Fechar` retorna à tab anterior; um deep link sem histórico cai na Agenda. O controle `Voltar` fica disponível para as próximas telas internas.

## Ainda falta para a DoD

- Compor os headers específicos de Home, Agenda, Finanças e Perfil junto com as telas reais. Não preencher placeholders com dados fictícios do HTML; valores, identidade e mês dependem do domínio/UX.
- Inspecionar visualmente em 390×844 e no iPhone com Dynamic Island; verificar VoiceOver, safe areas e ausência de conteúdo cortado. Android/TalkBack foi adiado pelo usuário, não removido da DoD.
- Confirmar status bar clara sobre os headers escuros quando essas telas substituírem os placeholders. Splash/ícone D1 permanecem bloqueados pelo vetor final aprovado na 2.2.
