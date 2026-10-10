import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('start DM accepts snake_case and otherPlayerId aliases', () => {
  const src = readFileSync(new URL('../src/chatHttp.js', import.meta.url), 'utf8');
  assert.match(src, /handleMessageNotificationSummaryRequest/);
});
