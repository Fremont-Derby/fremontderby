import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFargoExportRecord, exportFargoResult } from '../src/fargoExport.js';

test('fargo export records a finalized match and does not send it', () => {
  const record = buildFargoExportRecord({
    playerMatchId: 'match-1',
    playerAId: 'a',
    playerBId: 'b',
    playerAFargoId: '100',
    playerBFargoId: '200',
    racks: [{ number: 1, discipline: '8-ball', winnerId: 'a' }],
    playedOn: '2026-10-02',
    venue: '4Bs',
    tableSize: '7-foot',
  });
  assert.equal(record.sent, false);
  assert.equal(record.status, 'not_sent');
  assert.equal(record.score[0], 1);
  assert.equal(record.idempotencyKey, 'match-1:r1');
  assert.equal(JSON.stringify(record).includes('challonge'), false);
});

test('a missing Fargo id needs review and does not send', () => {
  const record = buildFargoExportRecord({
    playerMatchId: 'match-2',
    playerAId: 'a',
    playerBId: 'b',
    racks: [],
  });
  assert.equal(record.status, 'needs_review');
  assert.match(record.exception, /no Fargo id/);
});

test('a correction keeps the prior revision and adds a new one', () => {
  const first = exportFargoResult({ playerMatchId: 'match-3', playerAFargoId: '1', playerBFargoId: '2' });
  const second = exportFargoResult({ playerMatchId: 'match-3', playerAFargoId: '1', playerBFargoId: '2', revision: 2 }, first.record);
  assert.equal(second.previous.status, 'superseded');
  assert.equal(second.record.revision, 2);
  assert.equal(second.record.supersedes, 'match-3:r1');
});

test('the same revision does not create another record', () => {
  const first = exportFargoResult({ playerMatchId: 'match-4', revision: 1, playerAFargoId: '1', playerBFargoId: '2' });
  const again = exportFargoResult({ playerMatchId: 'match-4', revision: 1 }, first.record);
  assert.equal(again, first.record);
});

test('fargo export requires a match id', () => {
  assert.throws(() => buildFargoExportRecord({}), /playerMatchId is required/);
});
