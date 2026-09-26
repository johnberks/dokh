import { router, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { palette } from '@/theme/tokens';
import { useAuthSession } from './AuthSessionProvider';
import { useOnboardingStatus } from './onboarding-status';

/** Only resolved server state can select a route; errors never masquerade as first access. */
export function AuthNavigationGate() {
  const { t } = useTranslation('common');
  const session = useAuthSession();
  const onboarding = useOnboardingStatus(session.userId);
  const pathname = usePathname();
  const loading =
    session.status === 'loading' || (session.status === 'signedIn' && onboarding.isPending);
  const signedOut = session.status === 'signedOut';
  const incomplete = session.status === 'signedIn' && onboarding.data === false;
  const complete = session.status === 'signedIn' && onboarding.data === true;

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);

  useEffect(() => {
    if (loading || onboarding.isError || pathname !== '/') return;
    // Sem sessão o app começa pelo splash + tela 04; `Entrar` leva ao login (7.1).
    if (signedOut) router.replace('/intro');
    else if (incomplete) router.replace('/welcome');
  }, [incomplete, loading, onboarding.isError, pathname, signedOut]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.base} accessibilityLabel={t('states.loading')} />
      </View>
    );
  }
  if (session.status === 'signedIn' && onboarding.isError) {
    return (
      <PlaceholderScreen title={t('states.loadError')}>
        <Button label={t('actions.retry')} onPress={() => void onboarding.refetch()} />
      </PlaceholderScreen>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedOut}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={incomplete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={complete}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="work/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="work/[id]" />
        <Stack.Screen name="work/edit/[id]" />
        <Stack.Screen name="finances/entries" />
        <Stack.Screen name="finances/hourly" />
        <Stack.Screen name="dev/primitives" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="recover-password" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', backgroundColor: palette.cream },
});
