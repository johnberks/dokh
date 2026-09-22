import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createQueryClient } from '@/data/query-client';

/** D20/D21: nenhum dado de domínio persistido no device. SecureStore só guarda sessão (4.1). */
const root = join(__dirname, '../..');

const FORBIDDEN_PACKAGES = [
  '@react-native-async-storage/async-storage',
  'react-native-mmkv',
  'expo-sqlite',
  '@tanstack/react-query-persist-client',
  '@tanstack/query-async-storage-persister',
  '@tanstack/query-sync-storage-persister',
  'redux-persist',
];

// Uso real (chamada, JSX ou import), não menções em comentários.
const FORBIDDEN_SOURCE = [
  /persistQueryClient\s*\(/,
  /<PersistQueryClientProvider/,
  /from ['"]zustand\/middleware['"]/,
];

function listSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.(ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
}

describe('cache de domínio só em memória', () => {
  it('não instala bibliotecas de persistência local', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(deps.filter((dep) => FORBIDDEN_PACKAGES.includes(dep))).toEqual([]);
  });

  it('não usa persister do TanStack Query nem middleware de persistência do Zustand', () => {
    const offenders = [join(root, 'app'), join(root, 'src')]
      .flatMap(listSources)
      .flatMap((file) => {
        const text = readFileSync(file, 'utf8');
        return FORBIDDEN_SOURCE.filter((re) => re.test(text)).map((re) => `${file}: ${re}`);
      });
    expect(offenders).toEqual([]);
  });

  it('mutations não têm retry automático', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
