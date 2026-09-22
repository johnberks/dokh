import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/**
 * D38: nenhum texto de produto hardcoded em componente.
 * Usa o parser do TypeScript para achar texto literal entre tags JSX (<Text>Olá</Text>)
 * em rotas, features e componentes. Texto vindo de {t('...')} passa.
 */
const root = join(__dirname, '../..');
const ROOTS = ['app', 'src/features', 'src/components'].map((dir) => join(root, dir));

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

function literalJsxText(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) found.push(node.text.trim());
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('texto de interface', () => {
  it('não há texto literal em JSX fora do i18n', () => {
    const offenders = ROOTS.flatMap(listTsx).flatMap((file) =>
      literalJsxText(file).map((text) => `${file.replace(`${root}/`, '')}: "${text}"`),
    );
    expect(offenders).toEqual([]);
  });
});
