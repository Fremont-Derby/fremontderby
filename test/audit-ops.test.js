import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveSeason, auditChange, recomputeStandings, recoveryDrill, releaseManifest } from '../src/auditOps.js';

test('only a completed or validation season can be archived', () => {
  assert.equal(archiveSeason({ name: 'Spring', status: 'completed' }).archived, true);
  assert.equal(archiveSeason({ name: 'Spring', status: 'open' }).archived, false);
});

test('standings count only finalized wins', () => {
  assert.equal(recomputeStandings([{ winner: 'Owls', final: true }, { winner: 'Sharks', final: false }]).Owls, 1);
});

test('an audit row needs actor, time, reason, and both sides', () => {
  assert.equal(auditChange({ actor: 'Mina', at: '9pm', reason: 'fix', before: '3', after: '4' }).text.includes('Mina'), true);
  assert.equal(auditChange({ actor: 'Mina' }), null);
});

test('a stuck score has a recovery step', () => {
  assert.match(recoveryDrill('score-stuck').step, /hand/);
});

test('a release surface must be named', () => {
  assert.equal(releaseManifest({ name: 'schedule' }).approved, true);
  assert.equal(releaseManifest({}).approved, false);
});
