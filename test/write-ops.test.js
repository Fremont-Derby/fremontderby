import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, personaMatrix, regressionCheck, releaseManifest, reverseGate, staleWrite, supportInfra } from '../src/writeOps.js';

test('a stale client cannot overwrite the server', () => {
  assert.equal(staleWrite({ version: 1 }, { version: 2 }).ok, false);
  assert.equal(staleWrite({ version: 2 }, { version: 2 }).ok, true);
});

test('a passed gate needs a rerun', () => {
  assert.equal(regressionCheck({ passed: true, rerun: true }).ok, true);
  assert.equal(regressionCheck({ passed: true }).ok, false);
});

test('a fixture cannot use direct SQL', () => {
  assert.equal(fixture({ id: 'f1', sql: 'delete' }).ok, false);
  assert.equal(fixture({ id: 'f1' }).ok, true);
});

test('a gate needs an undo step', () => {
  assert.equal(reverseGate({ undo: 'Hide the banner.' }).ok, true);
  assert.equal(reverseGate({}).ok, false);
});

test('evidence names the persona and the gate', () => {
  assert.equal(personaMatrix({ persona: 'captain', gate: 'lineup' }).ok, true);
  assert.equal(personaMatrix({ persona: 'captain' }).ok, false);
});

test('a release names the surface', () => {
  assert.match(releaseManifest({ name: 'schedule' }).text, /schedule/);
});

test('support evidence is required', () => {
  assert.equal(supportInfra({}).ok, false);
});
