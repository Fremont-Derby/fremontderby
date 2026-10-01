import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('notifications league nav', () => {
  const src = readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/lineup"/);
  assert.match(src, /href="\/trades"/);
  assert.match(src, /href="\/availability"/);
  assert.match(src, /\['Score','\/scorecard'\]/);
});
