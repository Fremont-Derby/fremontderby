import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src/pathAliases.js'), 'utf8');
test('team chat accepts chat and team-messages aliases', () => {
  assert.match(src, /p\[4\] === 'chat' \|\| p\[4\] === 'team-messages'/);
  assert.match(src, /\/api\/teams\/\$\{p\[3\]\}\/messages/);
});
