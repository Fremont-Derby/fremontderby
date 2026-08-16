import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseOpenScoreString,
  normalizeFremontOpenMatch,
  dedupeMatchKeys,
} from '../src/fremontOpenImport.js';

test('parse open score strings', () => {
  assert.deepEqual(parseOpenScoreString('7-3'), {
    winnerRacks: 7, loserRacks: 3, confidence: 'high',
  });
  assert.equal(parseOpenScoreString('n/a').confidence, 'match_wl_only');
});

test('normalize requires stable external ids', () => {
  assert.throws(() => normalizeFremontOpenMatch({}), /required/);
  const n = normalizeFremontOpenMatch({
    externalEventId: 'fo-2025',
    externalMatchId: 'm-1',
    eventName: 'Fremont Open 2025',
    rawScore: '5-2',
    winnerName: 'A',
    loserName: 'B',
  });
  assert.equal(n.racksWonWinner, 5);
  assert.equal(n.scoreParseConfidence, 'high');
});

test('dedupe is idempotent by event+match id', () => {
  const a = normalizeFremontOpenMatch({ externalEventId: 'e', externalMatchId: 'm' });
  const b = normalizeFremontOpenMatch({ externalEventId: 'e', externalMatchId: 'm', rawScore: '1-0' });
  assert.equal(dedupeMatchKeys([a, b]).length, 1);
});

test('migration keeps evidence out of standings contract', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260816270000_fremont_open_import_evidence.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /external_tournament_matches/);
  assert.match(sql, /unique \(source, external_match_id\)/);
  assert.match(sql, /Never affect Derby standings/);
  assert.match(sql, /import_fremont_open_match/);
});
