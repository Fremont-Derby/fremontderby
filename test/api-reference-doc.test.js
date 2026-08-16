import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('API reference documents core routes', () => {
  assert.equal(existsSync(join(root, 'docs/API_REFERENCE.md')), true);
  const doc = readFileSync(join(root, 'docs/API_REFERENCE.md'), 'utf8');
  assert.match(doc, /\/api\/me/);
  assert.match(doc, /\/admin/);
  assert.match(doc, /service role never appears/i);
});
