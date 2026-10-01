
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('change-safety-net includes concrete canary example', () => {
  const doc = readFileSync(new URL('../docs/change-safety-net.md', import.meta.url), 'utf8');
  assert.match(doc, /Concrete example/);
  assert.match(doc, /assert-production-dns/);
  assert.match(doc, /CANARY_ONLY=production,www/);
  assert.match(doc, /Public surface canary passed/);
});
