# Exclusão de conta (4.6)

## Fluxo no app

Em **Perfil → Conta e segurança → Excluir conta** abre uma folha de confirmação. O padrão visual é o mesmo da exclusão de trabalho (P05): título, explicação, botão destrutivo e **Cancelar**. O usuário dispensou definir uma estética própria para esta tela.

- O texto diz o que some (trabalhos, recebíveis, residência, locais e foto, em todos os aparelhos) e que a ação não tem volta.
- Com Premium ativo, a folha avisa que a assinatura da loja **não** é cancelada junto.
- Contas Apple:
  - a Apple pede identificação antes de excluir (`requestAppleAuthorizationCode`), e cancelar essa etapa não exclui nada;
  - a linha "Alterar senha" some e o método de acesso mostra **Apple**.
- Se der erro, a folha continua aberta com **Tentar de novo**. Com sucesso, a sessão local é descartada e o app volta ao início (`/intro`).

## Edge Function `delete-account`

`supabase/functions/delete-account/index.ts` recebe `POST` com o JWT do usuário e, opcionalmente, `{ appleAuthorizationCode }`.

1. **Identidade:** `auth.getClaims(jwt)` valida a assinatura. O `sub` é o único usuário afetado.
2. **Storage:** apaga tudo sob `<uid>/` nos buckets `avatars` e `imports` pela Storage API, que remove também os bytes (ver [`private-storage.md`](private-storage.md)).
3. **Apple:** com `appleAuthorizationCode` e os segredos configurados, troca o código por token em `appleid.apple.com/auth/token` e o revoga em `/auth/revoke`. Sem segredos (ambiente local), registra `apple: skipped` e segue.
4. **Auth:** `auth.admin.deleteUser`. Todas as tabelas de domínio referenciam `auth.users` com `ON DELETE CASCADE`. Apagar o usuário invalida os refresh tokens e encerra as sessões em todos os aparelhos.

**Idempotente:** repetir depois de uma falha parcial completa o que faltou. Com a conta já apagada, a função só confirma (`404` no `deleteUser` é sucesso).

**Logs:** um JSON por chamada, com evento, contagem de arquivos, resultado da Apple e `alreadyDeleted`. Sem e-mail, nome, IDs ou tokens.

## Segredos da Apple (revogação)

Crie uma chave em Apple Developer → Certificates, IDs & Profiles → Keys, com **Sign in with Apple** habilitado para o App ID `br.com.dokh.app`. Baixe o `.p8`, que só pode ser baixado uma vez. Configure como segredos da função, **nunca no Git**:

```bash
npx supabase secrets set APPLE_TEAM_ID=596B42HL3M APPLE_KEY_ID=<KEY_ID> APPLE_PRIVATE_KEY="$(cat AuthKey_<KEY_ID>.p8)"
```

`APPLE_CLIENT_ID` tem `br.com.dokh.app` como padrão. Localmente, os mesmos valores podem ir em `supabase/functions/.env`, que é ignorado pelo Git, e são usados com `npx supabase functions serve --env-file supabase/functions/.env`.

## Testes

- `npm test`: `delete-account.test.ts` e os casos de `profile.test.tsx` (confirmação, cancelamento, falha, Premium e Apple).
- `npm run test:functions`: exige Supabase local e `npx supabase functions serve`. Cria uma conta descartável com perfil, local e avatar, mais uma segunda conta. Depois verifica:
  - `401` para chave anônima e para token inválido;
  - exclusão de dados, arquivo e usuário;
  - falha do refresh token;
  - repetição idempotente;
  - dados da outra conta intactos.

## Pendências da DoD

- A DoD técnica pede o teste no ambiente **preview**, que depende da 3.1. Por isso a 4.6 fica desmarcada.
- Deploy da função (`npx supabase functions deploy delete-account`) e segredos da Apple em preview/produção.
- O texto final de retenção e privacidade depende de P04.
