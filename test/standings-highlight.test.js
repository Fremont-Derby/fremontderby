import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isRequestedStanding } from '../src/standingsHighlight.js';

test('requested team match is case-insensitive and exact', () => {
  assert.equal(isRequestedStanding('Rail Sharks', 'rail sharks'), true);
  assert.equal(isRequestedStanding('Rail Sharks', 'Rail Owls'), false);
  assert.equal(isRequestedStanding('Rail Sharks', ''), false);
});

test('standings page reads team query and marks current row', () => {
  const source = readFileSync(new URL('../src/standingsPage.js', import.meta.url), 'utf8');
  assert.match(source, /query\.get\('team'\)/);
  assert.match(source, /dataset\.current='true'/);
  assert.match(source, /aria-current/);
});
