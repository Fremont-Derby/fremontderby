import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('CodeQL config uses a valid query suite (not bare "security")', () => {
  const configPath = join(root, '.github/codeql/codeql-config.yml');
  assert.ok(existsSync(configPath));
  const config = readFileSync(configPath, 'utf8');
  assert.ok(/uses:\s*security-extended/.test(config));
  assert.ok(!/uses:\s*security\s*$/m.test(config.replace(/uses:\s*security-extended/g, '')));
});

test('CodeQL workflow init uses security-extended and config-file', () => {
  const src = readFileSync(join(root, '.github/workflows/codeql.yml'), 'utf8');
  assert.ok(src.includes('queries: security-extended'));
  assert.ok(!/queries:\s*security\s*$/m.test(src.replace(/queries:\s*security-extended/g, '')));
  assert.ok(src.includes('config-file: ./.github/codeql/codeql-config.yml'));
  assert.ok(src.includes('languages: javascript'));
});
