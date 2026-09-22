#!/usr/bin/env node
// Mantém AGENTS.md (Codex) idêntico a CLAUDE.md (Claude Code). CLAUDE.md é a fonte canônica.
// Uso: node scripts/sync-agents.mjs          -> regrava AGENTS.md
//      node scripts/sync-agents.mjs --check  -> falha se AGENTS.md divergir
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'CLAUDE.md');
const target = join(root, 'AGENTS.md');
const canonical = readFileSync(source, 'utf8');

if (process.argv.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
  if (current !== canonical) {
    console.error('AGENTS.md diverge de CLAUDE.md. Rode: node scripts/sync-agents.mjs');
    process.exit(1);
  }
  console.log('AGENTS.md está sincronizado com CLAUDE.md.');
} else {
  writeFileSync(target, canonical);
  console.log('AGENTS.md atualizado a partir de CLAUDE.md.');
}
