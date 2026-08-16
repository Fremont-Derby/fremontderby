import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('moderation links score and schedule', () => {
  const src = readFileSync(new URL('../src/chatModerationPage.js', import.meta.url), 'utf8');
  assert.match(src, /href="\/scorecard"/);
  assert.match(src, /href="\/schedule"/);
  assert.match(src, /href="\/admin\/players"/);
});
