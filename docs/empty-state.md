# EmptyState — recorte da tarefa 2.5

Fontes: `docs/screens/home.md`, `agenda.md`, `financas.md`, `perfil.md` e respectivos HTMLs. `docs/technical-states.md` separa vazio legítimo de erro de leitura. Exemplos dos HTMLs são apenas exemplos; nenhum valor é inventado por este componente. Os arquivos de referência não foram modificados.

| Variante | Referência | Aparência e comportamento |
| --- | --- | --- |
| `homeEntries` | Home 05 | Copy tipográfica clara no hero escuro, CTA de texto bronze; sem `R$ 0` ou gráfico fictício. |
| `homeWork` | Home 06 | Card claro de raio 22, eyebrow Plex, título Archivo 20 e uma única área clicável. Dados financeiros adjacentes permanecem fora do componente. |
| `agendaDay` | Agenda 04 | Contorno tracejado, título 18, mensagem de dia livre e CTA secundário de 40 pontos com hitSlop até 44; não é card de Trabalho vazio. |
| `financesNoWork` | Finanças 11 | Introdução Archivo 30, CTA escuro de 56 e lista esmaecida de três capacidades, sem números inventados. Hero `R$ —` e navegação mensal pertencem à tela. |
| `entriesMonth` | Finanças 14 | Estado centralizado com mês informado pela tela; sem ilustração, `R$ 0` ou CTA que altere o período. A navegação entre meses pertence à tela. |
| `financesNextEntry` | Finanças 01-D/12 | Card tracejado `Nenhuma prevista`; descrição vem da projeção (tudo recebido ou valores sem data), preservando acesso ao extrato. |
| `profileLocations` | Perfil 03b | Bloco centralizado com botão de 56 pontos e `+`. |
| `profileResidency` | Perfil 05b | Bloco centralizado e nota explícita de que quem não faz residência não perde nada. Não presumir que ausência é incompletude. |
| `profileImportNoData` | Perfil 12c | Mensagem específica de arquivo **lido** com zero plantões e duas ações independentes. Não usar para arquivo ilegível ou falha de rede. |

O componente não consulta Supabase nem decide se a resposta está vazia. A feature só deve renderizá-lo após resposta válida; carregamento inicial usa `Skeleton` e falha de leitura usa `LoadError`. O conteúdo fica nos namespaces de i18n das seções. Os callbacks de CTA são fornecidos pela tela; esta biblioteca não supõe destino de navegação nem confirma recebimentos.

As superfícies aplicam a geometria/cor dos HTMLs com `StyleSheet` e tokens. O catálogo interno permite inspecionar as nove variações. A 2.5 continua aberta até os outros seis componentes, integração nas telas e inspeção em iPhone/VoiceOver; Android/TalkBack foi adiado pelo usuário, não removido da DoD.
