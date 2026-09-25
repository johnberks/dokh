import type { QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/data/supabase-client';
import {
  type AuthClient,
  type AuthSessionState,
  observeAuthSession,
  setupAuthRefresh,
  signOutAndRedirect,
} from './session';

type AuthSessionContextValue = AuthSessionState & { signOut: () => Promise<void> };
const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

type Props = { children: ReactNode; queryClient: QueryClient; client?: AuthClient };

/** Exposes user identity, never tokens. Route guards are implemented separately in 4.5. */
export function AuthSessionProvider({ children, queryClient, client = supabase }: Props) {
  const [state, setState] = useState<AuthSessionState>({ status: 'loading', userId: null });

  useEffect(() => observeAuthSession(client, queryClient, setState), [client, queryClient]);
  useEffect(() => setupAuthRefresh(client), [client]);

  const signOut = useCallback(
    () => signOutAndRedirect(client, queryClient, () => router.replace('/sign-in')),
    [client, queryClient],
  );

  return (
    <AuthSessionContext.Provider value={{ ...state, signOut }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error('AuthSessionProvider is required');
  return value;
}
