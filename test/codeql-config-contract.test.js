import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Tracks #2238 / #1850. Proof: CodeQL must not request the invalid pack name "security".

test('CodeQL workflow does not request the invalid security pack name', async () => {
  const source = await readFile(new URL('../.github/workflows/codeql.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /queries:\s*security\b/);
});

test('CodeQL config does not request the invalid security pack name', async () => {
  const source = await readFile(new URL('../.github/codeql/codeql-config.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /uses:\s*security\b/);
});
