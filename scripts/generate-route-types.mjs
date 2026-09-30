#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
// Gera .expo/types/router.d.ts (typed routes do Expo Router) sem subir o Metro.
// O `expo start` faz o mesmo automaticamente; isto existe para o typecheck e o CI.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));

process.env.EXPO_ROUTER_APP_ROOT = join(root, 'app');
// O `@expo/router-server` vem com o `@expo/cli` do próprio Expo do projeto (o npm pode aninhá-lo
// em expo/node_modules/@expo/cli). Resolver por esse caminho evita pegar uma cópia de fora do
// projeto, como um node_modules solto na pasta do usuário.
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
const typedRoutes = cliRequire('@expo/router-server/build/typed-routes');
const outputDir = join(root, '.expo/types');
mkdirSync(outputDir, { recursive: true });
typedRoutes.regenerateDeclarations(outputDir, {});
console.log('Tipos de rota gerados em .expo/types.');
