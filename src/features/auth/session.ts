import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import type { Database } from '@/data/database.types';

export type AuthClient = SupabaseClient<Database>;
export type AuthSessionState =
  | { status: 'loading'; userId: null }
  | { status: 'signedOut'; userId: null }
  | { status: 'signedIn'; userId: string };

export function observeAuthSession(
  client: AuthClient,
  queryClient: QueryClient,
  onChange: (state: AuthSessionState) => void,
): () => void {
  let previousUserId: string | null | undefined;
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    const userId = session?.user.id ?? null;
    if (event === 'SIGNED_OUT' || (previousUserId !== undefined && previousUserId !== userId)) {
      // Never leave another account's domain rows in the in-memory Query cache.
      queryClient.clear();
    }
    previousUserId = userId;
    onChange(userId ? { status: 'signedIn', userId } : { status: 'signedOut', userId: null });
  });
  return () => subscription.unsubscribe();
}

/** Supabase refreshes only while the app is foregrounded. */
export function setupAuthRefresh(client: AuthClient): () => void {
  function sync(status: AppStateStatus) {
    if (status === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  }
  sync(AppState.currentState);
  const subscription = AppState.addEventListener('change', sync);
  return () => {
    subscription.remove();
    client.auth.stopAutoRefresh();
  };
}

/** A local logout preserves other devices and redirects only after Auth removes this session. */
export async function signOutAndRedirect(
  client: AuthClient,
  queryClient: QueryClient,
  redirect: () => void,
) {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
  queryClient.clear();
  redirect();
}
