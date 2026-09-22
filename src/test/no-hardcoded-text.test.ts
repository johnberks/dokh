import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * D38: nenhum texto de produto hardcoded em componente.
 * Detecta texto literal entre tags JSX (ex.: <Text>Olá</Text>) em rotas, features e componentes.
 * Texto dinâmico ({t('...')}) e chaves de i18n passam.
 */
const ROOTS = ['app', 'src/features', 'src/components'];
const JSX_TEXT = />\s*([^<>{}\s][^<>{}]*[A-Za-zÀ-ÿ][^<>{}]*)\s*</g;

function listTsx(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listTsx(path);
    return path.endsWith('.tsx') && !path.endsWith('.test.tsx') ? [path] : [];
  });
}

describe('texto de interface', () => {
  it('não há texto literal em JSX fora do i18n', () => {
    const offenders = ROOTS.flatMap(listTsx).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(JSX_TEXT)].map((m) => `${file}: "${m[1].trim()}"`),
    );
    expect(offenders).toEqual([]);
  });
});
