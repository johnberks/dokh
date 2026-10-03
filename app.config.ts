import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` é a configuração base. Aqui entra só o que depende de variável pública de build:
 * o URL scheme do Entrar com Google (4.4), derivado do client ID OAuth do iOS
 * (`<id>.apps.googleusercontent.com` → `com.googleusercontent.apps.<id>`). Sem a variável, o
 * build sai sem o Google e o botão fica indisponível — nunca quebra.
 */
export function googleIosUrlScheme(iosClientId: string): string {
  const id = iosClientId.trim().replace(/\.apps\.googleusercontent\.com$/u, '');
  return `com.googleusercontent.apps.${id}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const plugins: NonNullable<ExpoConfig['plugins']> = [...(config.plugins ?? [])];
  if (iosClientId) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleIosUrlScheme(iosClientId) },
    ]);
  }
  return { ...config, name: config.name ?? 'DOKH', slug: config.slug ?? 'dokh', plugins };
};
