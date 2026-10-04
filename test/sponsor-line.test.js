import test from 'node:test';
import assert from 'node:assert/strict';
import { sponsorLine } from '../src/sponsorLine.js';

test('a team card names the sponsor', () => {
  assert.equal(sponsorLine('4Bs'), 'Sponsor: 4Bs');
  assert.equal(sponsorLine(''), 'Sponsor not set');
});
