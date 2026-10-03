import test from 'node:test';
import assert from 'node:assert/strict';
import { missingFargoLinks } from '../src/fargoReportStore.js';

test('a finalized match with no Fargo id is an admin exception', () => {
  const rows = missingFargoLinks([
    { playerMatchId: 'm1', playerAName: 'Grok Fill 07 713', playerBName: 'DRU Test Actor', playerAFargoId: null, playerBFargoId: null },
    { playerMatchId: 'm2', playerAName: 'Kept', playerBName: 'Kept', playerAFargoId: '1', playerBFargoId: '2' },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].player_match_id, 'm1');
  assert.equal(rows[0].payload.playerAName, 'Grok Fill 07 713');
});

import { withoutMissing } from '../src/fargoReportStore.js';
test('a match missing a Fargo id is not also listed as ready to send', () => {
  const rows = withoutMissing([{ player_match_id: 'm1' }, { player_match_id: 'm2' }], [{ player_match_id: 'm1' }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].player_match_id, 'm2');
});
