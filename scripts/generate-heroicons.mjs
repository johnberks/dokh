#!/usr/bin/env node
// Gera src/components/icons/heroicons.tsx a partir do pacote oficial heroicons (24/solid).
// Para incluir um ícone: adicione o nome (como em heroicons.com) em NAMES e rode
// `node scripts/generate-heroicons.mjs && npx biome check --write src/components/icons`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VERSION = '2.2.0';
const NAMES = [
  'academic-cap',
  'adjustments-horizontal',
  'arrow-down',
  'arrow-path',
  'arrow-right',
  'arrow-right-start-on-rectangle',
  'banknotes',
  'book-open',
  'briefcase',
  'building-office-2',
  'calendar-date-range',
  'calendar-days',
  'camera',
  'chart-bar',
  'chart-pie',
  'chat-bubble-left-right',
  'check',
  'check-circle',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'clipboard-document-list',
  'clock',
  'document-text',
  'eye',
  'eye-slash',
  'flag',
  'home',
  'lock-closed',
  'magnifying-glass',
  'map-pin',
  'pencil',
  'plus',
  'question-mark-circle',
  'eye-dropper',
  'shield-check',
  'star',
  'sun',
  'user-circle',
  'wallet',
  'x-mark',
];

const dir = mkdtempSync(join(tmpdir(), 'heroicons-'));
execFileSync('npm', ['pack', `heroicons@${VERSION}`, '--silent'], { cwd: dir });
execFileSync('tar', ['xzf', `heroicons-${VERSION}.tgz`], { cwd: dir });

const pascal = (name) =>
  `${name
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')}Icon`;

const icons = NAMES.map((name) => {
  const svg = readFileSync(join(dir, 'package/24/solid', `${name}.svg`), 'utf8');
  const paths = [...svg.matchAll(/<path([^>]*)\/>/g)].map(([, attrs]) => ({
    d: attrs.match(/\sd="([^"]+)"/)[1],
    evenOdd: attrs.includes('fill-rule="evenodd"'),
  }));
  if (paths.length === 0 || /<(?!path|svg|\/svg)\w/.test(svg)) {
    throw new Error(`${name}: só caminhos <path> são suportados`);
  }
  const items = paths.map((p) => `{ d: '${p.d}'${p.evenOdd ? ', evenOdd: true' : ''} }`).join(', ');
  return `export const ${pascal(name)} = hero([${items}]);`;
});

const header = `// Gerado por scripts/generate-heroicons.mjs a partir de heroicons@${VERSION} (24/solid),
// MIT © Tailwind Labs — https://heroicons.com. Não edite à mão.
import Svg, { Path } from 'react-native-svg';

export type HeroIconProps = {
  size?: number;
  color: string;
  testID?: string;
};

type HeroPath = { d: string; evenOdd?: true };

function hero(paths: readonly HeroPath[]) {
  /** Ícone decorativo (Heroicons Solid): o texto ao lado ou o rótulo do botão diz o significado. */
  return function HeroIcon({ size = 24, color, testID }: HeroIconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        accessible={false}
        testID={testID}
      >
        {paths.map((path) => (
          <Path
            key={path.d}
            d={path.d}
            fillRule={path.evenOdd ? 'evenodd' : undefined}
            clipRule={path.evenOdd ? 'evenodd' : undefined}
          />
        ))}
      </Svg>
    );
  };
}
`;
writeFileSync('src/components/icons/heroicons.tsx', `${header}\n${icons.join('\n')}\n`);
console.log(`${icons.length} ícones gerados`);
