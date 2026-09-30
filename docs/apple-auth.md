# Entrar com Apple (4.3)

## Fluxo

1. O botão **Continuar com Apple** das telas 04 (`WelcomeScreen`) e 05B (`SignInScreen`) só fica ativo quando `isAppleSignInAvailable()` é verdadeiro, ou seja, no iOS com suporte. Em Android/web ele continua visível e indisponível, como o Google (4.4). O visual é o do HTML; o botão customizado segue as regras de marca da Apple: logo oficial, título aprovado e contraste.
2. `signInWithApple` (`src/features/auth/apple-auth.ts`) gera um nonce aleatório. A Apple recebe o SHA-256 dele e o Supabase recebe o original em `signInWithIdToken({ provider: 'apple' })`. Isso impede reaproveitar o token.
3. Cancelar a folha da Apple não é erro: nada acontece. As falhas mostram só uma mensagem genérica, sem PII.
4. Com a sessão criada, o app volta para `/` e o `AuthNavigationGate` decide o destino. Uma conta nova não tem perfil e vai ao onboarding; uma conta existente com onboarding concluído vai às abas. O perfil é criado só no fim do onboarding, por upsert, e por isso é idempotente.
5. A Apple entrega o nome **apenas no primeiro login**:
   - ele é salvo nos metadados da conta (`given_name`, `full_name`);
   - o primeiro nome preenche o rascunho da tela de nome, que a pessoa pode editar.

## Configuração

- `app.json`: `ios.usesAppleSignIn: true` e o plugin `expo-apple-authentication`. É mudança nativa e exige um novo build de desenvolvimento: `npx eas-cli build --platform ios --profile development`. O EAS habilita a capability *Sign in with Apple* no App ID `br.com.dokh.app`.
- Supabase **local** (`supabase/config.toml`):
  - `[auth.external.apple] enabled = true` com `client_id = "br.com.dokh.app,host.exp.Exponent"`. O segundo ID aceita o Expo Go.
  - O segredo (`SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`) só serve ao fluxo OAuth web, que a DOKH não usa.
  - Para aplicar, rode `npx supabase stop && npx supabase start`; os dados ficam preservados no backup de volumes.
- Supabase **preview/produção** (3.1): no painel, em Authentication → Providers → Apple, cadastrar o mesmo *Client ID* `br.com.dokh.app`. Ainda não foi feito.

## Pendências da DoD

- Login real no iPhone: confirmado pelo usuário em 2026-09-30, com o novo build de desenvolvimento e o Supabase local.
- Na exclusão de conta (4.6), a Apple exige revogar o token de quem entrou com Apple. Para isso é preciso uma chave *Sign in with Apple* (.p8) no servidor, cadastrada como segredo da Edge Function e nunca no Git.
