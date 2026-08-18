import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('codeql analyzes javascript with security queries', () => {
  const yml = readFileSync('.github/workflows/codeql.yml', 'utf8');
  assert.match(yml, /languages: javascript/);
  assert.match(yml, /queries: security/);
  assert.match(yml, /codeql-config\.yml/);
  assert.match(yml, /branches: \[main\]/);
});
