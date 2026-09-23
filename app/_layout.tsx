import '@/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getEnv } from '@/config/env';
import { AppProviders } from '@/features/app-shell/AppProviders';
import { BrandFontProvider } from '@/theme/BrandFontProvider';

// Falha cedo, com mensagem explícita, se o ambiente estiver incompleto (1.4).
getEnv();

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }} testID="gesture-handler-root">
      <BrandFontProvider>
        <AppProviders>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="dev/primitives" options={{ gestureEnabled: false }} />
            <Stack.Screen name="work/new" options={{ presentation: 'modal' }} />
          </Stack>
        </AppProviders>
      </BrandFontProvider>
    </GestureHandlerRootView>
  );
}
