import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

test('canary:contract runs public-surface and production-dns contract tests', () => {
  assert.match(scripts['canary:contract'], /public-surface-contract\.test\.js/);
  assert.match(scripts['canary:contract'], /assert-production-dns\.test\.js/);
});
