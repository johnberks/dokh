# Cliente Supabase e sessão segura — 4.1

Fontes: `decisions.md` D19–D21/D40–D44, `domain-model.md`, `docs/screens/onboarding.md`, `design/onboarding.html` e DoD 4.1. Nenhum HTML de referência foi alterado. A interface de login desenhada pertence à 4.2; os guards sem flicker pertencem à 4.5.

## Contrato implementado

- `src/data/supabase-client.ts` cria um único cliente tipado com as variáveis públicas já validadas da 1.4. A chave `service_role` nunca entra no app. A chave de armazenamento é separada por ambiente (`dokh.local.auth`, `dokh.preview.auth`, `dokh.production.auth`).
- `src/data/secure-auth-storage.ts` é o único adapter de persistência de Auth. Ele divide a sessão em partes pequenas no `expo-secure-store` para respeitar limites nativos de payload e escreve o manifesto por último, preservando a sessão anterior se uma escrita de parte falhar. Não há AsyncStorage, arquivo local ou persistência do cache TanStack Query.
- `AuthSessionProvider` expõe apenas `status` e `userId`, jamais access/refresh token. O Supabase renova a sessão somente em foreground; a inscrição e o listener são removidos ao desmontar. O guard de rotas agora está em `docs/auth-guards.md` (4.5 parcial).
- Trocar de usuário ou receber `SIGNED_OUT` limpa o cache de domínio em memória. `signOut()` usa escopo `local`, remove a sessão via Supabase Auth e só então redireciona para `/sign-in`; os guards gerais continuam para a 4.5.

## Verificação e limites

- Jest cobre armazenamento acima de 2 KB, leitura por nova instância, substituição interrompida, remoção dos fragmentos, troca de usuário, foreground/background e ordem do logout/redirect.
- `node scripts/test-auth-session-4.1.mjs` usa **somente o Supabase local**: cria uma conta sintética descartável, faz login, reabre um cliente, verifica a sessão, sai localmente e exclui a conta no `finally`. A service key é lida em tempo de execução pela CLI e existe apenas nesse script Node, nunca no bundle mobile. O comando integra `npm run test:db` e não executa reset.
- A prova de `SecureStore` nativo após fechar/reabrir o app no iPhone e o logout por uma tela real continuam pendentes da 4.2/4.5; por isso o checkbox 4.1 permanece desmarcado. Android foi adiado a pedido do usuário.
- O Expo Go com `EXPO_PUBLIC_SUPABASE_ANON_KEY=replace-after-supabase-start` ainda abre as telas placeholder, mas **não** autentica. Para um teste real no iPhone, configurar URL LAN do Supabase local e a chave pública real, ou concluir EAS/preview. Nunca usar `127.0.0.1` como URL de API vista pelo iPhone físico.
