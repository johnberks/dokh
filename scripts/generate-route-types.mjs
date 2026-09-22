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
const typedRoutes = require('@expo/router-server/build/typed-routes');
const outputDir = join(root, '.expo/types');
mkdirSync(outputDir, { recursive: true });
typedRoutes.regenerateDeclarations(outputDir, {});
console.log('Tipos de rota gerados em .expo/types.');
