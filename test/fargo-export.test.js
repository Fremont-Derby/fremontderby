import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFargoExportRecord } from '../src/fargoExport.js';

test('fargo export records a finalized match and does not send it', () => {
  const record = buildFargoExportRecord({
    playerMatchId: 'match-1',
    playerAId: 'a',
    playerBId: 'b',
    playerAFargoId: '100',
    racks: [{ number: 1, discipline: '8-ball', winnerId: 'a' }],
    playedOn: '2026-10-02',
    venue: '4Bs',
  });
  assert.equal(record.sent, false);
  assert.equal(record.status, 'not_sent');
  assert.equal(record.racks[0].discipline, '8-ball');
  assert.equal(JSON.stringify(record).includes('challonge'), false);
});

test('fargo export requires a match id', () => {
  assert.throws(() => buildFargoExportRecord({}), /playerMatchId is required/);
});
