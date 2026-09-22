import { z } from 'zod';

/**
 * Variáveis que podem ir para o bundle mobile. Todas são públicas por natureza (README).
 * Secrets (service role, Resend, webhook do RevenueCat, tokens de CI) nunca entram aqui
 * e nunca usam o prefixo EXPO_PUBLIC_.
 */
export const APP_ENVS = ['local', 'preview', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const LOCAL_HOSTS = /^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)$/;

export const publicEnvSchema = z
  .object({
    EXPO_PUBLIC_APP_ENV: z.enum(APP_ENVS),
    EXPO_PUBLIC_SUPABASE_URL: z.url(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
    // Opcionais até as fases de observabilidade (13) e billing (5).
    EXPO_PUBLIC_POSTHOG_KEY: optionalText,
    EXPO_PUBLIC_POSTHOG_HOST: z
      .url()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    EXPO_PUBLIC_SENTRY_DSN: optionalText,
    EXPO_PUBLIC_REVENUECAT_IOS_API_KEY: optionalText,
    EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY: optionalText,
  })
  .superRefine((env, ctx) => {
    // Sem `new URL()`: a implementação de URL do React Native não expõe `hostname` de forma confiável.
    const host = /^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+)/i.exec(env.EXPO_PUBLIC_SUPABASE_URL)?.[1] ?? '';
    if (env.EXPO_PUBLIC_APP_ENV !== 'local' && LOCAL_HOSTS.test(host)) {
      ctx.addIssue({
        code: 'custom',
        path: ['EXPO_PUBLIC_SUPABASE_URL'],
        message: `${env.EXPO_PUBLIC_APP_ENV} não pode apontar para um Supabase local`,
      });
    }
  });

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(
      [
        'Configuração de ambiente inválida:',
        ...issues.map((issue) => `  - ${issue}`),
        'Copie .env.example para .env.local, preencha os valores e reinicie o Metro (npx expo start --clear).',
      ].join('\n'),
    );
    this.name = 'EnvValidationError';
  }
}

export function parsePublicEnv(raw: Record<string, string | undefined>): PublicEnv {
  const result = publicEnvSchema.safeParse(raw);
  if (result.success) return result.data;
  const issues = result.error.issues.map((issue) => {
    const key = issue.path.join('.') || 'env';
    return raw[key] === undefined || raw[key] === ''
      ? `${key}: obrigatória e ausente`
      : `${key}: ${issue.message}`;
  });
  throw new EnvValidationError(issues);
}
