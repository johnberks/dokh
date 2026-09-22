import { type PublicEnv, parsePublicEnv } from './env.schema';

/**
 * O Expo só injeta EXPO_PUBLIC_* com acesso estático (process.env.EXPO_PUBLIC_X).
 * Não trocar por acesso dinâmico nem por spread de process.env.
 */
function readRawEnv(): Record<string, string | undefined> {
  return {
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SUPABASE_PREVIEW_PROJECT_REF: process.env.EXPO_PUBLIC_SUPABASE_PREVIEW_PROJECT_REF,
    EXPO_PUBLIC_SUPABASE_PRODUCTION_PROJECT_REF:
      process.env.EXPO_PUBLIC_SUPABASE_PRODUCTION_PROJECT_REF,
    EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY,
    EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  };
}

let cached: PublicEnv | undefined;

/** Valida na primeira leitura e falha com mensagem explícita se faltar variável obrigatória. */
export function getEnv(): PublicEnv {
  cached ??= parsePublicEnv(readRawEnv());
  return cached;
}
