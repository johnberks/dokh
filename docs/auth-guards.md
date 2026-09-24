# Guards de sessão e onboarding — 4.5 parcial

Fontes: `decisions.md` D15/D18/D20/D21/D40–D44, `domain-model.md` (`profiles.onboarding_completed_at`), `docs/screens/onboarding.md`, `design/onboarding.html` e DoD 4.5. Nenhum HTML foi alterado.

## Contrato

O `AuthNavigationGate` só monta a pilha de rotas depois que a sessão segura e, quando necessário, a consulta do perfil terminam. O splash nativo permanece visível durante essa decisão inicial; quando a sessão muda com o app já aberto, uma superfície neutra com indicador de carregamento evita mostrar a rota antiga ou um quadro vazio. Erro de leitura do perfil mostra retry, nunca presume onboarding incompleto. A consulta usa o UUID da sessão, RLS e cache TanStack Query em memória, separado por usuário e revalidado no retorno ao foreground. Troca de conta e saída limpam o cache de domínio conforme 4.1.

| Sessão | `onboarding_completed_at` | Destino permitido |
| --- | --- | --- |
| Ausente | — | `(auth)`; `/sign-in` é a entrada canônica |
| Presente | Perfil ausente ou campo nulo | `(onboarding)`; `/welcome` é a entrada canônica |
| Presente | Timestamp salvo | `(tabs)` e modal `work/new` |

As rotas de confirmação, recuperação e redefinição de senha ficam fora dos grupos protegidos para preservar deep links e a sessão temporária criada pelo reset. O catálogo `/dev/primitives` acompanha as tabs, não é uma rota privada aberta a anônimos. Um deep link para grupo não permitido cai na primeira rota permitida; a URL `/` é normalizada para `/sign-in` ou `/welcome` nesses estados.

## Limites e validação pendente

- A UI do onboarding ainda é placeholder; a 7.2 implementará as telas 01–10 do HTML e salvará `onboarding_completed_at` somente depois da conclusão real. Após essa escrita, invalidar `onboardingStatusKey(userId)` para liberar as tabs. Não há bypass do guard nem preenchimento fictício de perfil.
- `Sair da conta` existe temporariamente em `__DEV__` no Perfil e na introdução do onboarding, para validar a saída no Expo Go. A tela final de Perfil substituirá essa entrada conforme `design/perfil.html`.
- O teste automatizado cobre os três estados, deep links privados, retenção do splash até a resolução, erro/retry e consulta de perfil. Ainda é necessário observar no iPhone físico: abrir sem sessão, entrar com conta local concluída, sair, entrar com primeiro acesso incompleto, fechar/reabrir sem flash da Home e validar reset por link. Android segue adiado pelo usuário. Por isso a DoD 4.5 permanece aberta.
- Fixtures locais após `supabase db reset --local`: `premium@example.invalid` e `free@example.invalid` têm perfil concluído; `novo@example.invalid` permanece incompleto. Senha sintética em `supabase/seed.sql`. Não usar essas contas em preview/production.
