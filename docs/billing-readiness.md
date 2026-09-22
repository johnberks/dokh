# Preparação para RevenueCat (billing)

A integração real acontece na **Fase 5** do `build-plan.md`. Este documento lista o que precisa estar correto **antes**, para que nenhuma tarefa anterior tenha de ser refeita. Preços e product IDs seguem pendentes (P01).

## O que o RevenueCat vai exigir do app

| Item | Regra | Onde entra |
| --- | --- | --- |
| Identidade do app | iOS `bundleIdentifier` e Android `package` = `com.dokh.app`; scheme `dokh`. **Não mudar depois** que apps forem criados nas lojas/RevenueCat. | 1.1 (`app.json`) |
| `app_user_id` | UUID do Supabase (`auth.users.id`). Nunca e-mail. `Purchases.logIn(userId)` no login, `logOut()` no logout. | 4.1, 5.3 |
| Entitlement | Um único: `premium`. Offering `default` com packages mensal e anual. | 5.2 |
| Espelho no servidor | `subscription_entitlements` conforme `domain-model.md` (`last_event_id` garante idempotência do webhook, `environment` separa sandbox de production). | 3.4, 5.4 |
| Webhook | Edge Function `revenuecat-webhook`, autenticada por `REVENUECAT_WEBHOOK_AUTH_TOKEN` (secret de servidor), sem JWT de usuário. | 5.4 |
| Chaves | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` são públicas; opcionais até a Fase 5. O token do webhook nunca usa `EXPO_PUBLIC_`. | 1.4 |
| Preços | Lidos da offering ativa. Nunca hardcodar. | 5.5 |
| Restore purchase | Obrigatório nos dois sistemas. | 5.5 |
| Termos e Privacidade | URLs exigidas pelo paywall e pelas lojas (P04). | 5.5, 14.1 |
| Exclusão de conta | Exigida pela Apple para apps com conta. | 4.6 |
| Development build | `react-native-purchases` tem código nativo. No Expo Go só funciona em Preview API Mode (sem compra real). | 5.3 |

## Como evitar retrabalho até lá

1. **Provider de entitlement abstrato** em `src/features/premium/`: uma interface (`isPremium`, `refresh`, `purchase`, `restore`) com implementação stub. As telas e o `PremiumGate` consomem só a interface; na Fase 5 troca-se a implementação por RevenueCat sem tocar nas telas.
2. **Override de desenvolvimento** para testar Premium no Expo Go: permitido apenas com `__DEV__` e `EXPO_PUBLIC_APP_ENV=local`, nunca em preview/production. Ele **não** contorna o servidor: escritas Premium continuam validando `subscription_entitlements` (dado de teste via seed).
3. **Gates Premium sempre com duas camadas**: cliente (provider) e servidor (entitlement no RPC). Feature flag não substitui entitlement.
4. **Sessão estável**: o `user.id` do Supabase precisa estar disponível cedo (4.1) porque é o identificador do RevenueCat.

## Etapas humanas (fora do código)

- Apple Developer Program ativo, Paid Apps Agreement, dados bancários e fiscais.
- Google Play Console com conta de comerciante e service account com permissões financeiras.
- Projeto RevenueCat com apps iOS e Android, chaves da App Store Connect API/In-App Purchase e credenciais do Google Play.
- Produtos mensal e anual criados nas duas lojas (P01) e associados ao entitlement `premium`.
- App Store Server Notifications e RTDN do Google apontando para o RevenueCat.
- Usuários de teste: Sandbox (Apple) e License Testers (Google).
