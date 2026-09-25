import '@/i18n';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getEnv } from '@/config/env';
import { AppProviders } from '@/features/app-shell/AppProviders';
import { AuthNavigationGate } from '@/features/auth/AuthNavigationGate';
import { BrandFontProvider } from '@/theme/BrandFontProvider';

// Falha cedo, com mensagem explícita, se o ambiente estiver incompleto (1.4).
getEnv();

export const unstable_settings = { initialRouteName: '(auth)' };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }} testID="gesture-handler-root">
      <BrandFontProvider hideSplashWhenReady={false}>
        <AppProviders>
          <StatusBar style="dark" />
          <AuthNavigationGate />
        </AppProviders>
      </BrandFontProvider>
    </GestureHandlerRootView>
  );
}
