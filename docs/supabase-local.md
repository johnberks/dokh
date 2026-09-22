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

Preview e production exigem **dois projetos Supabase distintos**, criados na
organização correta por quem administra a conta. Não reutilize projetos de outros
produtos. Registre os dois *project refs* públicos nas variáveis
`EXPO_PUBLIC_SUPABASE_PREVIEW_PROJECT_REF` e
`EXPO_PUBLIC_SUPABASE_PRODUCTION_PROJECT_REF`. Para preview, configure
`EXPO_PUBLIC_APP_ENV=preview` e a URL `https://<preview-ref>.supabase.co`; para
production, use `production` e `https://<production-ref>.supabase.co`. A chave
publishable/anon deve vir do **mesmo projeto** da URL. O app recusa refs iguais,
URL local e URL do projeto errado no ambiente remoto. Refs e chaves públicas vão
para o bundle; service role e senhas ficam fora de `EXPO_PUBLIC_*` e do Git.

Até a tarefa 1.9 (EAS) e a 4.1 (cliente e sessão), essa configuração é um contrato
validado por testes, **não uma prova de conexão real**. Para fechar a DoD da 3.1,
suba e resete o banco local com Docker funcional e verifique uma build preview
apontando apenas ao projeto preview, com refs reais e teste de rede. Nunca rode
`supabase db reset --linked` para tentar essa verificação.
