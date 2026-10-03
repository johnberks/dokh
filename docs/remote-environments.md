# Ambientes remotos: preview e produção (3.1)

| Ambiente | Projeto | Ref | Uso |
| --- | --- | --- | --- |
| Preview | `dokh-preview` | `lakpndtdkcjtazoybgnv` | builds `preview` (instalação interna) |
| Produção | `dokh-production` | `irdsieciowovsaakikbf` | builds `production` (TestFlight/App Store) |

Os comandos abaixo manipulam senhas e chaves, então quem roda é **a pessoa dona da conta**, no próprio terminal. Os agentes não leem nem copiam esses valores. As senhas de banco e as chaves publishable ficam em `supabase/.env.local`, ignorado pelo Git e com permissão `0600`.

## 0. Reativar os projetos (Dashboard)

No plano Free, projetos parados por 7 dias são **pausados**; em 2026-09-30 os dois estavam `INACTIVE`. Em cada projeto, clique em Dashboard → **Restore project** e espere ficar *Healthy*.

> Produção no Free continua pausando por inatividade e não tem backup diário. Antes de ter pessoas reais usando, mude o projeto de produção para o plano Pro.

## 1. Chave publishable no EAS

A URL e o `EXPO_PUBLIC_APP_ENV` já estão cadastrados. Falta a chave de cada projeto, que fica em *Project Settings → API Keys → Publishable key*:

```bash
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility plaintext
```

O `src/config/env.schema.ts` recusa URL local ou o projeto errado: uma build preview nunca fala com produção.

## 2. Banco: aplicar as migrations

Sempre **preview primeiro**. `db push` só aplica migrations novas e nunca roda o seed. **Nunca** use `db reset --linked`.

```bash
npx supabase link --project-ref lakpndtdkcjtazoybgnv   # pede a senha do banco de preview
npx supabase db push --dry-run                         # confere a lista
npx supabase db push
npx supabase functions deploy delete-account
```

Para produção, repita com `--project-ref irdsieciowovsaakikbf` depois de validar o preview. Ao terminar, rode `npx supabase unlink` para o checkout não ficar ligado a produção.

`pg_cron` já vem disponível no Supabase hospedado. As migrations 3.9/3.10 agendam os jobs de residência e recorrência, e isso pode ser conferido em *Integrations → Cron*.

## 3. Auth (Dashboard, em cada projeto)

- **URL Configuration:**
  - *Site URL* `dokh://`;
  - *Redirect URLs* `dokh://auth-callback` e `dokh://reset-password`.
  - Não usar `exp://**`: ele serve só ao Expo Go local.
- **Providers → Apple:** ativar; em *Client IDs*, `br.com.dokh.app`. O *Secret Key* só serve ao fluxo web e fica vazio.
- **E-mail:** o SMTP padrão do Supabase só envia para membros da organização e tem limite baixo. Para testers reais (confirmação de cadastro e recuperação de senha), configure SMTP próprio em *Authentication → Emails → SMTP Settings*. O projeto prevê Resend (`RESEND_API_KEY`).

## 4. Segredos da exclusão de conta (4.6)

Com a chave `.p8` de *Sign in with Apple* (ver [`account-deletion.md`](account-deletion.md)):

```bash
npx supabase secrets set --project-ref lakpndtdkcjtazoybgnv APPLE_TEAM_ID=596B42HL3M APPLE_KEY_ID=<KEY_ID> APPLE_PRIVATE_KEY="$(cat AuthKey_<KEY_ID>.p8)"
```

## 5. Prova da 3.1

```bash
npx eas-cli build --platform ios --profile preview
```

Instale no iPhone, crie uma conta e confirme que ela aparece em *Authentication → Users* do `dokh-preview` e não aparece no de produção. Com isso a 3.1 é marcada.
