import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('codeql-config ignores test and scripts and uses security queries', () => {
  const yml = readFileSync('.github/codeql/codeql-config.yml', 'utf8');
  assert.match(yml, /paths-ignore:/);
  assert.match(yml, /test\/\*\*/);
  assert.match(yml, /scripts\/\*\*/);
  assert.match(yml, /uses: security/);
});
