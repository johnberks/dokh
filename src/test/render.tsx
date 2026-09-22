import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { AppProviders } from '@/features/app-shell/AppProviders';

/** QueryClient isolado por teste, sem retry, para falhas aparecerem na hora. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      // gcTime infinito evita timers pendentes que impedem o Jest de encerrar.
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
    },
  });
}

/** No RNTL 14 `render` é assíncrono: sempre use `await renderWithProviders(...)`. */
export async function renderWithProviders(ui: ReactElement, queryClient = createTestQueryClient()) {
  const utils = await render(<AppProviders queryClient={queryClient}>{ui}</AppProviders>);
  return { queryClient, ...utils };
}
