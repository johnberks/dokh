import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { createQueryClient, setupQueryLifecycle } from '@/data/query-client';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';

type Props = { children: ReactNode; queryClient?: QueryClient };

/** Providers globais do app. `queryClient` só é injetado em testes. */
export function AppProviders({ children, queryClient }: Props) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  useEffect(() => setupQueryLifecycle(), []);

  return (
    <QueryClientProvider client={client}>
      <AuthSessionProvider queryClient={client}>{children}</AuthSessionProvider>
    </QueryClientProvider>
  );
}
