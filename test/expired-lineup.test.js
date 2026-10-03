import test from 'node:test';
import assert from 'node:assert/strict';
import { expiredLineupLine } from '../src/expiredLineup.js';
import { renderLineupPage } from '../src/lineupPage.js';

test('an expired lineup keeps the unsaved rack sentence', () => {
  assert.equal(expiredLineupLine({ expired: true }), 'That lineup expired. The unsaved rack is still here.');
  assert.match(renderLineupPage(), /That lineup expired. The unsaved rack is still here/);
});
