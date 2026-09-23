# Supabase: local, preview e production

O Supabase CLI usa `supabase/config.toml` versionado. O projeto local tem ID `dokh`,
portas padrão 54321–54324, migrations habilitadas e seed de domínio desabilitado até
a tarefa 3.12. Realtime está desligado conforme D28. As migrations 3.2–3.5
criam perfis, preferências, o núcleo profissional e o suporte operacional com
RLS. O cliente Supabase no app ainda depende da 4.1.

## Ambiente local

Requer Docker Desktop funcional e Node 22. Execute **na raiz deste repositório**:

```bash
fnm exec --using=22 npm ci
fnm exec --using=22 npm run supabase:start
fnm exec --using=22 npm run supabase:status
fnm exec --using=22 npm run supabase:reset
```

`supabase:reset` apaga **somente o banco local** e reaplica as migrations. Não use
`--linked` ou `--db-url` neste fluxo. Copie `.env.example` para `.env.local` e use
a URL e a publishable/anon key exibidas por `supabase:status`. No iPhone físico,
substitua `127.0.0.1` da URL pelo IP LAN do computador; o iPhone e o computador
devem estar na mesma rede. Reinicie o Metro após alterar o `.env.local`.

Para aplicar migrations novas sem apagar dados locais e verificar 3.2–3.5:

```bash
SUPABASE_TELEMETRY_DISABLED=1 fnm exec --using=22 npx supabase migration up --local
fnm exec --using=22 npm run test:db
fnm exec --using=22 npm run check:db-types
```

`test:db` cria bancos temporários no contêiner PostgreSQL local, aplica as
migrations, testa constraints, índices, dono/outro usuário/anônimo e executa
os SQLs de rollback versionados; não reseta o banco DOKH em uso. O rollback é
**só para esses bancos descartáveis**: Supabase migrations de produção são
forward-only.
Os tipos versionados em `src/data/database.types.ts` foram gerados do banco
local. Para regenerá-los após uma migration, execute
`SUPABASE_TELEMETRY_DISABLED=1 fnm exec --using=22 npx supabase gen types typescript --local --schema public`
e formate com Biome. O CI repete os testes SQL e compara os tipos gerados.

Na 3.2, `profiles.id` é o ID de Auth e `user_id` é uma coluna gerada igual a
ele, usada pelas policies; o cliente não deve enviá-la. `timezone` deve vir
do device e ser reconhecida como zona IANA no Postgres. Os quatro toggles de
notificação começam em `false` por segurança; a permissão do sistema continua
separada e será tratada na 12.1.

Na 3.3, `work_locations`, `work_series`, `work_entries`, `residencies` e
`receivables` foram criadas. A origem do Recebível é exatamente uma (Trabalho
ou Residência), com unicidade por Trabalho e por mês de Residência. FKs
compostas com `user_id` impedem referências a dados de outra conta. Plantão
exige início e duração positiva; Local arquivado permanece nos Trabalhos
históricos, mas não pode ser selecionado em novos cadastros. Índices por
usuário/data sustentam Agenda, caixa e competência. Os tokens de cor aceitos
seguem a paleta vista nos HTMLs da Agenda; nenhum hexadecimal arbitrário é
armazenado.

As cinco tabelas permitem `SELECT` somente ao dono. Escritas diretas do app
estão fechadas, inclusive para criação de Local Free: 3.7/3.9 devem fornecer
RPCs atômicas, que devem validar o espelho de entitlement antes de liberar série
e paleta Premium. O schema permite uma ocorrência de
Trabalho sem Recebível enquanto uma transação privilegiada a constrói; a RPC
da 3.7 deve garantir que a transação termine com exatamente um.

Na 3.4, `subscription_entitlements` é o espelho de leitura do RevenueCat: apenas
o webhook futuro pode escrevê-lo, com um `last_event_id` único por ambiente.
`device_push_tokens` aceita escrita do próprio dono, com token único e hash de
identificação não reversível. `imports` e `import_issues` são visíveis só ao
dono, mas a escrita fica reservada às Edge Functions. O hash SHA-256 do arquivo
é único por usuário; `work_entries` agora exige `import_id` e chave de linha
normalizada quando a origem é importação, ambos protegidos por FK/índice. O
`summary`/`payload` é metadado para preview e correção, não fonte de Trabalho:
a futura confirmação transacional precisa reler o arquivo validado. A política
de retenção de arquivos/importações segue pendente em D74; não exclua o registro
de importação de um Trabalho já confirmado. Nenhuma migration foi aplicada em
preview ou production.

Na 3.5, a auditoria de RLS cobriu as 12 tabelas públicas de usuário. A migration
remove privilégios herdados de `TRUNCATE`, `REFERENCES`, `TRIGGER` e `MAINTAIN`
de `anon`/`authenticated`, preserva CRUD do dono apenas para perfil,
preferências e token push, e mantém as tabelas de domínio/agregados e billing
em leitura do dono. `service_role` recebe CRUD explícito para Edge Functions;
continua proibido no app. Grants padrão de novas tabelas criadas por migrations
como `postgres` passam a negar acesso do cliente até que a migration o libere
explicitamente com RLS. Não há views públicas hoje; o teste falha se uma futura
view pública não usar `security_invoker = true` ou se uma materialized view ficar
legível pelo cliente. Tipos gerados não mudaram com a revisão de privilégios e
`npm run check:db-types` confirmou a paridade. A 3.5 também foi aplicada somente
no banco local, sem reset ou alteração dos projetos remotos.

## Projetos remotos

Os projetos remotos foram criados em `johnberks's Org` (plano Free, região São
Paulo / `sa-east-1`):

| Ambiente | Projeto | Project ref público | URL |
| --- | --- | --- | --- |
| Preview | `dokh-preview` | `lakpndtdkcjtazoybgnv` | `https://lakpndtdkcjtazoybgnv.supabase.co` |
| Production | `dokh-production` | `irdsieciowovsaakikbf` | `https://irdsieciowovsaakikbf.supabase.co` |

Os refs estão fixos em `src/config/env.schema.ts`. Para preview, configure
`EXPO_PUBLIC_APP_ENV=preview`, a URL acima e a chave **publishable** do projeto
preview em `EXPO_PUBLIC_SUPABASE_ANON_KEY` (nome legado da variável). Para
production, use `production`, a URL e a chave publishable de production. O app
recusa URL local ou URL do projeto errado no ambiente remoto; uma variável de
build não consegue alterar os refs aceitos. A chave precisa vir do **mesmo
projeto** da URL. Não reutilize projetos de outros produtos. Refs e chaves
publishable são públicos; service role, secret key e senhas ficam fora de
`EXPO_PUBLIC_*` e do Git.

Na máquina onde os projetos foram criados, `supabase/.env.local` (ignorado pelo
Git, permissões `0600`) guarda as senhas de banco e as chaves publishable para
retomada. Se esse arquivo não estiver disponível, recupere as chaves públicas
em *Project Settings → API Keys* e redefina a senha de banco no Dashboard.
Nenhum secret foi enviado ao PR.

Em 2026-09-22, `supabase start`, `supabase db reset --local` e o health local
passaram. As chaves publishable de ambos os projetos remotos foram aceitas nos
respectivos endpoints REST e rejeitadas (`401`) no projeto oposto. Isso valida
o isolamento de infraestrutura, mas não uma **conexão real do app preview**:
EAS (1.9) e cliente/sessão (4.1) ainda não existem. Mantenha a 3.1 desmarcada
até essa prova em build preview. Nunca rode `supabase db reset --linked` para
tentar essa verificação. Projetos Free podem pausar por inatividade; antes de
testar uma build antiga, confira o estado dos dois no Dashboard.
