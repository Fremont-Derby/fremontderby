import test from 'node:test';
import assert from 'node:assert/strict';
import { prizeCount } from '../src/prizeCount.js';

test('a prize count from other nights is not shown', () => {
  assert.equal(prizeCount({ player_count: 59, paid_amount_cents: 0 }), '');
  assert.equal(prizeCount({ player_count: 12, paid_amount_cents: 0 }), '12');
});
