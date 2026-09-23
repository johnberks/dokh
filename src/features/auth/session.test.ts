import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import {
  type AuthClient,
  observeAuthSession,
  setupAuthRefresh,
  signOutAndRedirect,
} from './session';

describe('auth session lifecycle', () => {
  it('publishes only identity and clears in-memory domain data on account change and sign-out', () => {
    const queryClient = new QueryClient();
    const changes: unknown[] = [];
    let emit: (event: AuthChangeEvent, session: Session | null) => void = () => {};
    const unsubscribe = jest.fn();
    const client = {
      auth: {
        onAuthStateChange: (callback: typeof emit) => {
          emit = callback;
          return { data: { subscription: { unsubscribe } } };
        },
      },
    } as unknown as AuthClient;
    const stop = observeAuthSession(client, queryClient, (state) => changes.push(state));

    emit('INITIAL_SESSION', { user: { id: 'user-one' } } as Session);
    queryClient.setQueryData(['private'], { owner: 'user-one' });
    emit('TOKEN_REFRESHED', { user: { id: 'user-one' } } as Session);
    expect(queryClient.getQueryData(['private'])).toEqual({ owner: 'user-one' });
    emit('SIGNED_IN', { user: { id: 'user-two' } } as Session);
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    queryClient.setQueryData(['private'], { owner: 'user-two' });
    emit('SIGNED_OUT', null);
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    expect(changes).toEqual([
      { status: 'signedIn', userId: 'user-one' },
      { status: 'signedIn', userId: 'user-one' },
      { status: 'signedIn', userId: 'user-two' },
      { status: 'signedOut', userId: null },
    ]);
    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('refreshes only in foreground and removes its listener', () => {
    const startAutoRefresh = jest.fn();
    const stopAutoRefresh = jest.fn();
    let onStateChange: (state: 'active' | 'background') => void = () => {};
    const remove = jest.fn();
    const addListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_, listener) => {
        onStateChange = listener as typeof onStateChange;
        return { remove };
      });
    const client = { auth: { startAutoRefresh, stopAutoRefresh } } as unknown as AuthClient;

    const dispose = setupAuthRefresh(client);
    onStateChange('background');
    onStateChange('active');
    expect(startAutoRefresh).toHaveBeenCalled();
    expect(stopAutoRefresh).toHaveBeenCalled();
    const stoppedBeforeDispose = stopAutoRefresh.mock.calls.length;
    dispose();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(stopAutoRefresh).toHaveBeenCalledTimes(stoppedBeforeDispose + 1);
    addListener.mockRestore();
  });

  it('signs out locally, clears cache and redirects only after success', async () => {
    const signOut = jest.fn(async () => ({ error: null }));
    const client = { auth: { signOut } } as unknown as AuthClient;
    const queryClient = new QueryClient();
    queryClient.setQueryData(['private'], { owner: 'user-one' });
    const redirect = jest.fn();

    await signOutAndRedirect(client, queryClient, redirect);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('does not navigate after a failed server logout', async () => {
    const client = {
      auth: { signOut: jest.fn(async () => ({ error: new Error('offline') })) },
    } as unknown as AuthClient;
    const redirect = jest.fn();
    await expect(signOutAndRedirect(client, new QueryClient(), redirect)).rejects.toThrow(
      'offline',
    );
    expect(redirect).not.toHaveBeenCalled();
  });
});
