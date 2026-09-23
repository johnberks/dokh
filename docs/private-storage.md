# Storage privado (3.6)

Os buckets `avatars` e `imports` são privados e criados pela migration `20260922040000_private_storage.sql`. Ambos limitam cada objeto a 10 MiB. O limite de imports segue D58; a validação de extensão, MIME e conteúdo da importação ainda cabe à Edge Function de 11.6, não ao bucket sozinho.

## Contrato de caminhos

- `avatars`: `<auth.uid()>/<uuid-do-arquivo>.<extensão>`; `profiles.avatar_path` guarda só o caminho relativo ao bucket.
- `imports`: `<auth.uid()>/<uuid-do-arquivo>.<extensão>`; `imports.storage_path` guarda só o caminho relativo ao bucket, coerente com a constraint da tabela.
- Não usar nome original do arquivo, e-mail, nome da pessoa ou dado clínico no caminho. Não reutilizar o mesmo caminho para substituir conteúdo.

As policies de `storage.objects` permitem `SELECT`, `INSERT` e `DELETE` apenas quando a primeira pasta é o UUID do JWT. Não há `UPDATE`: a troca de avatar cria um novo objeto, atualiza `profiles.avatar_path` e remove o antigo via Storage API após confirmar a troca. O cliente nunca recebe a service role. Para operações do servidor, usá-la somente em Edge Functions.

Para exibir/baixar arquivos, usar download autenticado ou URL assinada curta; não usar URL pública. A URL assinada é uma capacidade de acesso até expirar, inclusive para quem não estiver autenticado; não registrá-la em logs nem persistir como caminho de perfil/import. A exclusão deve passar pela Storage API, que remove metadados e bytes, não por `DELETE` SQL em `storage.objects`.

O teste `npm run test:db` exercita a API local com duas contas descartáveis: upload, download, bloqueio cruzado/anônimo, URL assinada válida/expirada, MIME negado, objeto imutável e remoção de bytes. Não rodar esse teste contra preview/produção. Os objetos e usuários criados pelo teste são removidos ao final.

A remoção automática de arquivos de importação após conclusão/expiração (D73) fica para o job posterior. O prazo exato (D74) segue pendente de produto/jurídico; não inferir retenção aqui. A exclusão de conta com purge de Storage também será implementada na tarefa 4.6.
