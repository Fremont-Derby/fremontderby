import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('empty notices offer one next action', () => {
  const source = fs.readFileSync(new URL('../src/notificationsPage.js', import.meta.url), 'utf8');
  assert.match(source, /No notices yet/);
  assert.match(source, /\[\['Open schedule','\/schedule'\]\]/);
  assert.doesNotMatch(source, /\['Score','\/scorecard'\]/);
});
