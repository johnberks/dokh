import '@/i18n';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { getEnv } from '@/config/env';
import { AppProviders } from '@/features/app-shell/AppProviders';
import { AuthNavigationGate } from '@/features/auth/AuthNavigationGate';
import { NotificationSync } from '@/features/notifications/NotificationSync';
import { BrandFontProvider } from '@/theme/BrandFontProvider';

// Falha cedo, com mensagem explícita, se o ambiente estiver incompleto (1.4).
getEnv();

export const unstable_settings = { initialRouteName: '(auth)' };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }} testID="gesture-handler-root">
      {/* Teclado tratado no app inteiro: o campo em foco nunca fica escondido (Onboarding v2). */}
      <KeyboardProvider>
        <BrandFontProvider hideSplashWhenReady={false}>
          <AppProviders>
            <StatusBar style="dark" />
            <AuthNavigationGate />
            {/* Lembretes locais: reagendados a cada abertura e escrita; sair da conta cancela. */}
            <NotificationSync />
          </AppProviders>
        </BrandFontProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
