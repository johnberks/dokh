# Supabase: local, preview e production

O Supabase CLI usa `supabase/config.toml` versionado. O projeto local tem ID `dokh`,
portas padrão 54321–54324, migrations habilitadas e seed de domínio desabilitado até
a tarefa 3.12. Realtime está desligado conforme D28. Ainda não há migrations nem
cliente Supabase no app (tarefas 3.2–3.5 e 4.1).

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
