import test from 'node:test';
import assert from 'node:assert/strict';
import { DRU_QA_MISSIONS, listDruQaMissionIds, buildDruQaFixture } from '../src/qaMissionCatalog.js';

test('catalog lists unique portable mission ids', () => {
  const ids = listDruQaMissionIds();
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('player.find-next-match'));
  assert.ok(ids.includes('captain.add-players'));
  assert.ok(ids.includes('player.mark-availability'));
  assert.ok(ids.includes('captain.score-first-rack'));
});

test('catalog rebuilds a fixture from mission id and seed', () => {
  const a = buildDruQaFixture('captain.score-first-rack', 'catalog-2');
  const b = buildDruQaFixture('captain.score-first-rack', 'catalog-2');
  assert.equal(a.missionId, 'captain.score-first-rack');
  assert.deepEqual(a.match, b.match);
});

test('every catalog entry points at a JFL card and a fixture builder', () => {
  for (const entry of DRU_QA_MISSIONS) {
    assert.equal(typeof entry.mission.missionId, 'string');
    assert.equal(typeof entry.build, 'function');
    assert.equal(typeof entry.jflCard, 'number');
  }
});
