import assert from 'node:assert/strict';
import test from 'node:test';
import { isRequestedStanding } from '../src/standingsHighlight.js';
import { assertSameThread, assertWritableThread } from '../src/chatThreadGuard.js';
import { chatSendPayload } from '../src/chatComposerPayload.js';
import { DRU_QA_MISSIONS, listDruQaMissionIds, buildDruQaFixture } from '../src/qaMissionCatalog.js';

// Tracks #2433 — portable pack coverage for Gamma CI.
test('portable pack lists all ten QA missions and builds fixtures', () => {
  const ids = listDruQaMissionIds();
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  for (const entry of DRU_QA_MISSIONS) {
    const fixture = buildDruQaFixture(entry.mission.missionId, 'pack-seed');
    assert.equal(fixture.missionId, entry.mission.missionId);
    assert.equal(fixture.schemaVersion, 1);
  }
});

test('standings highlight matches requested names only', () => {
  assert.equal(isRequestedStanding('Rail Owls', 'rail owls'), true);
  assert.equal(isRequestedStanding('Rail Owls', 'Green Felt'), false);
  assert.equal(isRequestedStanding('Rail Owls', ''), false);
});

test('chat helpers keep replies on the open writable thread', () => {
  assert.equal(assertSameThread('t1', 't1'), 't1');
  assert.throws(() => assertSameThread('t1', 't2'));
  assert.throws(() => assertWritableThread(false));
  const payload = chatSendPayload({ body: 'ok', thread: { kind: 'team', id: 'team-1' } });
  assert.equal(payload.expectedTeamId, 'team-1');
});
