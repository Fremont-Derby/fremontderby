import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMatchLine } from '../src/nextMatchLine.js';
import { renderSchedulePage } from '../src/schedulePage.js';

test('the next match names both teams and the date', () => {
  assert.equal(nextMatchLine({ home: 'Owls', away: 'Pines', date: '2026-10-03' }), 'Next match: Owls vs Pines on 2026-10-03.');
  assert.equal(nextMatchLine({}), '');
  assert.doesNotMatch(renderSchedulePage(), /Next match: Owls vs Pines on 2026-10-03/);
});
