# Entrar com Google (4.4)

Login nativo, igual ao da Apple (4.3).
- `@react-native-google-signin/google-signin` abre o Google e devolve um **ID token**.
- `supabase.auth.signInWithIdToken({ provider: 'google' })` confere a audiência do token e cria ou reaproveita a conta.
- Não há redirecionamento pelo Supabase, então o login funciona também contra o Supabase local pela LAN. No iPhone, a janela mostra "google.com".

## Código

- `src/features/auth/google-auth.ts`:
  - `isGoogleSignInAvailable()`: precisa do web client ID e, no iOS, também do iOS client ID;
  - `signInWithGoogle(client)`: devolve `signedIn` com o primeiro nome (vai para o rascunho do nome, como o da Apple) ou `cancelled`. A conta do Google não fica presa ao aparelho (`GoogleSignin.signOut()` logo depois do token).
- `SocialChoices` (`AuthVisuals.tsx`): os botões Apple e Google funcionam um por vez. Sem os client IDs, o Google aparece indisponível, como antes.
- Conta e segurança: método `Google` e sem "Trocar senha". A exclusão não pede nada à Apple.
- `app.config.ts`: o URL scheme do iOS (`com.googleusercontent.apps.<id>`) sai de `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` **no build**. Sem a variável, o build sai sem o Google e nada quebra.

## Variáveis (públicas)

| Variável | O que é |
| --- | --- |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | client OAuth do tipo **Web**: é a audiência do ID token que o Supabase aceita |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | client OAuth do tipo **iOS** (bundle `br.com.dokh.app`); também gera o URL scheme |

Elas ficam em três lugares:
- `.env.local`: o Metro lê em desenvolvimento;
- EAS, nos ambientes `development`, `preview` e `production`: o build lê;
- o Supabase de cada ambiente, como `Client IDs`.

## Configuração (feita pela pessoa dona das contas)

1. **Google Cloud** ([console.cloud.google.com](https://console.cloud.google.com)), num projeto "DOKH":
   - **Google Auth Platform → Branding:** nome DOKH, e-mail de suporte e logo.
   - **Audience:** usuários externos. Em "Testing", só os e-mails listados entram (até 100). Como os escopos são básicos (`openid`, `email`, `profile`), dá para publicar ("In production") sem verificação, e os amigos entram sem precisar estar na lista.
   - **Clients → Create client:**
     - **Web application** "DOKH Supabase". Em *Authorized redirect URIs*: `https://lakpndtdkcjtazoybgnv.supabase.co/auth/v1/callback` e `https://irdsieciowovsaakikbf.supabase.co/auth/v1/callback`. Guarde o **Client ID** e o **Client secret**.
     - **iOS** "DOKH iOS", bundle ID `br.com.dokh.app`. Guarde o **Client ID**.
     - Android fica para depois: o pacote `br.com.dokh.app` precisa do SHA-1 da chave do EAS (`npx eas-cli credentials`).
2. **Supabase, preview e produção** (*Authentication → Sign In / Providers → Google*):
   - ativar;
   - **Client IDs:** `<web client id>,<ios client id>`;
   - **Client Secret:** o do web client;
   - **Skip nonce checks:** ligado (o SDK do Google no iOS não repassa nonce).
3. **EAS**, para cada ambiente (`development`, `preview`, `production`):
   ```bash
   npx eas-cli env:create --environment development --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "<web client id>" --visibility plaintext
   npx eas-cli env:create --environment development --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "<ios client id>" --visibility plaintext
   ```
4. **`.env.local`:** as mesmas duas linhas.
5. **Supabase local:** em `supabase/config.toml`, `[auth.external.google]` com `enabled = true` e `client_id = "<web>,<ios>"` (públicos, podem ir para o Git). Depois `npx supabase stop && npx supabase start`.
6. **Novo build** (o URL scheme é nativo).

## Testes

- `google-auth.test.ts`:
  - disponibilidade (no iOS exige o iOS client ID);
  - troca do token;
  - cancelamento pela resposta e pelo código;
  - token ausente;
  - erro do Supabase;
  - ambiente sem configuração.
- `social-choices.test.tsx`: Google indisponível sem os IDs, sucesso com o nome no rascunho, cancelamento e mensagem de falha.
- `app-config.test.ts`: o URL scheme e o build sem o plugin quando falta o ID.
- `profile.test.tsx`: Conta e segurança para conta Google.

**DoD 4.4:** login real no iPhone devolve sessão e a conta esperada. Uma conta de e-mail com o mesmo endereço confirmado é vinculada pelo Supabase. Android segue adiado.
