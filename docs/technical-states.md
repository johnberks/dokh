# Estados técnicos compartilhados — tarefa 2.6

`src/components/TechnicalStates.tsx` concentra feedback de carregamento, falha de leitura, falha de escrita e ausência de conexão. Os HTMLs de Home, Agenda, Finanças e Perfil não trazem esses estados; por isso as superfícies usam somente tokens existentes, sem alterar ou reinterpretar as telas de referência. O catálogo interno `/dev/primitives` demonstra todas as variações.

| Componente | Quando usar | Contrato |
| --- | --- | --- |
| `Skeleton` | Primeira carga sem dados válidos | Blocos estruturais `summary` ou `list`; nenhum valor, porcentagem, data ou dado inventado. Não manter na tela após erro. |
| `LoadError` | Falha de uma query sem dados válidos | Mensagem neutra e botão `Tentar novamente` com alvo mínimo de 44 pontos. Nunca substituir por `EmptyState`. `retrying` bloqueia toque repetido. |
| `MutationError` | Falha de escrita junto à ação | O formulário permanece sob controle da feature; este componente não limpa rascunho. `onRetry` é opcional e só deve ser passado para operação comprovadamente idempotente. |
| `OfflineBanner` | Conexão indisponível | `showingCachedData` indica que dados já carregados em memória podem estar desatualizados. Não há fila offline nem persistência local. |

Refetch com dados existentes deve preservar os dados e mostrar indicador discreto da própria tela, não substituir o conteúdo pelo `Skeleton`. Estado vazio só é permitido após resposta válida. A integração futura de queries/mutations deve enviar erros sanitizados ao adaptador Sentry quando este existir; os componentes não recebem objetos de erro nem registram dados sensíveis. Confirmar status acessível, contraste e proporções no iPhone com VoiceOver; Android/TalkBack está adiado pelo usuário. Por isso a 2.6 continua sem checkbox de concluída.
