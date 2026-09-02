import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/codeql.yml', import.meta.url), 'utf8');
const config = readFileSync(new URL('../.github/codeql/codeql-config.yml', import.meta.url), 'utf8');

test('CodeQL workflow does not request a non-existent security pack', () => {
  assert.match(workflow, /uses:\s+github\/codeql-action\/init@v3/);
  assert.match(workflow, /languages:\s+javascript/);
  assert.match(workflow, /config-file:\s+\.\/\.github\/codeql\/codeql-config\.yml/);
  assert.doesNotMatch(workflow, /^\s+queries:\s*security\s*$/m);
  assert.doesNotMatch(workflow, /queries:\s*security\s*$/m);
});

test('CodeQL config file does not declare uses: security as a pack', () => {
  assert.match(config, /paths-ignore:/);
  assert.match(config, /test\/\*\*/);
  assert.doesNotMatch(config, /^\s+-\s+uses:\s*security\s*$/m);
  assert.doesNotMatch(config, /^queries:\s*$/m);
});
