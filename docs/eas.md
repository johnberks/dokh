# EAS (tarefa 1.9)

Projeto `@jberks/dokh` (ID `285cce47-d906-40fc-a6ea-168a3dd63919`), ligado em `app.json`
(`owner`, `extra.eas.projectId`, `updates.url`).

## Perfis (`eas.json`)

| Perfil | Uso | Distribuição | Canal OTA | EAS Environment |
| --- | --- | --- | --- | --- |
| `development` | app com `expo-dev-client`, lê o `.env.local` pelo Metro | interna | `development` | `development` |
| `preview` | build de teste apontando para `dokh-preview` | interna | `preview` | `preview` |
| `production` | loja, build com número incrementado no servidor | loja | `production` | `production` |

- `runtimeVersion` segue a versão do app (`policy: appVersion`): um update só chega a builds da
  mesma `version`. Ao mudar código nativo (novo pacote nativo, plugin), subir a `version`.
- `appVersionSource: remote`: o número de build fica no EAS, não no repositório.

## Variáveis

Ficam em **EAS Environments**, nunca no `eas.json` nem no Git:

| Variável | preview | production |
| --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `preview` ✅ | `production` ✅ |
| `EXPO_PUBLIC_SUPABASE_URL` | URL de `dokh-preview` ✅ | URL de `dokh-production` ✅ |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | chave publishable de preview — **falta** | chave publishable de production — **falta** |

Sem a chave, o app de preview/production falha na validação de ambiente ao abrir
(`src/config/env.schema.ts`). Para cadastrar (o comando pede o valor):

```bash
npx eas-cli env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --visibility plaintext
```

O perfil `development` não precisa de variáveis no EAS: o Metro injeta as do `.env.local`.

## Comandos

`npm run start` continua abrindo no **Expo Go** (`--go`); com um build de desenvolvimento instalado,
use `npm run start:dev-client`.

```bash
npx eas-cli build --platform android --profile development   # APK de desenvolvimento
npx eas-cli build --platform ios --profile development       # exige Apple Developer Program
npx eas-cli update --channel preview --environment preview --message "..."
```

## DoD pendente

- Build de desenvolvimento de iOS: depende da conta paga da Apple (o usuário ainda não tem).
- Build de Android: depende de aparelho/emulador Android para instalar (validação Android adiada).
- Update no canal `preview` recebido por um build preview: depende da chave publishable e de um
  build instalado. Isso também fecha a prova da 3.1 (app preview conectado só a `dokh-preview`).
