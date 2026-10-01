import test from 'node:test';
import assert from 'node:assert/strict';
import { standingsContext } from '../src/standingsContext.js';
test('standings context needs a team and a rank', () => {
  assert.equal(standingsContext({ team: '', rank: 2, played: 3 }).ok, false);
  assert.equal(standingsContext({ team: 'Bandits', rank: 2, played: 3 }).ok, true);
});
