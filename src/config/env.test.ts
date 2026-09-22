import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  EnvValidationError,
  parsePublicEnv,
  publicEnvSchema,
  SUPABASE_PROJECT_REFS,
} from './env.schema';

const valid = {
  EXPO_PUBLIC_APP_ENV: 'local',
  EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
};
const previewRef = 'lakpndtdkcjtazoybgnv';
const productionRef = 'irdsieciowovsaakikbf';

describe('env público', () => {
  it('aceita o mínimo obrigatório e trata opcionais vazios como ausentes', () => {
    const env = parsePublicEnv({
      ...valid,
      EXPO_PUBLIC_SENTRY_DSN: '',
      EXPO_PUBLIC_POSTHOG_HOST: '',
    });
    expect(env.EXPO_PUBLIC_APP_ENV).toBe('local');
    expect(env.EXPO_PUBLIC_SENTRY_DSN).toBeUndefined();
    expect(env.EXPO_PUBLIC_POSTHOG_HOST).toBeUndefined();
  });

  it('falha com mensagem clara listando a variável obrigatória ausente', () => {
    const { EXPO_PUBLIC_SUPABASE_ANON_KEY: _omit, ...missing } = valid;
    expect(() => parsePublicEnv(missing)).toThrow(EnvValidationError);
    expect(() => parsePublicEnv(missing)).toThrow(
      /EXPO_PUBLIC_SUPABASE_ANON_KEY: obrigatória e ausente/,
    );
    expect(() => parsePublicEnv(missing)).toThrow(/\.env\.example/);
  });

  it('rejeita ambiente desconhecido e URL inválida', () => {
    expect(() => parsePublicEnv({ ...valid, EXPO_PUBLIC_APP_ENV: 'staging' })).toThrow(
      /EXPO_PUBLIC_APP_ENV/,
    );
    expect(() => parsePublicEnv({ ...valid, EXPO_PUBLIC_SUPABASE_URL: 'not-a-url' })).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL/,
    );
  });

  it('impede preview/production de apontar para Supabase local', () => {
    for (const appEnv of ['preview', 'production']) {
      expect(() => parsePublicEnv({ ...valid, EXPO_PUBLIC_APP_ENV: appEnv })).toThrow(
        /não pode apontar para um Supabase local/,
      );
    }
  });

  it('fixa refs distintos dos projetos remotos DOKH no código', () => {
    expect(SUPABASE_PROJECT_REFS).toEqual({ preview: previewRef, production: productionRef });
  });

  it('exige a URL exata do ambiente remoto, independentemente das variáveis de build', () => {
    const preview = {
      ...valid,
      EXPO_PUBLIC_APP_ENV: 'preview',
      EXPO_PUBLIC_SUPABASE_URL: `https://${previewRef}.supabase.co`,
    };
    expect(parsePublicEnv(preview).EXPO_PUBLIC_APP_ENV).toBe('preview');
    expect(() =>
      parsePublicEnv({
        ...preview,
        EXPO_PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co`,
        EXPO_PUBLIC_SUPABASE_PREVIEW_PROJECT_REF: productionRef,
      }),
    ).toThrow(/deve apontar exclusivamente para o projeto preview/);
    expect(() =>
      parsePublicEnv({ ...preview, EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' }),
    ).toThrow(/deve apontar exclusivamente para o projeto preview/);
    expect(() =>
      parsePublicEnv({ ...preview, EXPO_PUBLIC_SUPABASE_URL: `http://${previewRef}.supabase.co` }),
    ).toThrow(/deve apontar exclusivamente para o projeto preview/);
    expect(
      parsePublicEnv({
        ...preview,
        EXPO_PUBLIC_APP_ENV: 'production',
        EXPO_PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co`,
      }).EXPO_PUBLIC_APP_ENV,
    ).toBe('production');
  });

  it('só declara variáveis EXPO_PUBLIC_ no schema do bundle', () => {
    for (const key of Object.keys(publicEnvSchema.shape)) {
      expect(key.startsWith('EXPO_PUBLIC_')).toBe(true);
    }
  });
});

describe('secrets fora do bundle', () => {
  const SERVER_ONLY = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'REVENUECAT_WEBHOOK_AUTH_TOKEN',
    'SENTRY_AUTH_TOKEN',
    'EXPO_TOKEN',
  ];

  function listSources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return listSources(path);
      return /\.(ts|tsx)$/.test(path) && !path.endsWith('.test.ts') ? [path] : [];
    });
  }

  it('código do app não referencia variáveis exclusivas de servidor', () => {
    const root = join(__dirname, '../..');
    const offenders = [join(root, 'app'), join(root, 'src')]
      .flatMap(listSources)
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8');
        return SERVER_ONLY.filter((name) => text.includes(name)).map((name) => `${file}: ${name}`);
      });
    expect(offenders).toEqual([]);
  });
});
