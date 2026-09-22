import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus, Platform } from 'react-native';

/**
 * Estado do servidor só em memória (D20, D21): `persistQueryClient` e qualquer persister
 * são proibidos no MVP. Reabrir o app sempre parte de cache vazio.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnReconnect: true,
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Escritas financeiras não são reenviadas automaticamente; o retry é uma ação explícita.
        retry: false,
      },
    },
  });
}

/**
 * Retorno ao foreground e reconexão revalidam dados (CLAUDE.md > Queries e mutations).
 * Devolve a função de limpeza.
 */
export function setupQueryLifecycle(): () => void {
  const appStateSubscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  });

  // O onlineManager guarda e limpa o listener sozinho quando ele é substituído.
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    }),
  );

  return () => {
    appStateSubscription.remove();
  };
}
