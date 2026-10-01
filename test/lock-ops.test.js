import test from 'node:test';
import assert from 'node:assert/strict';
import { functionalHealth, lineupLock, migrationRehearsal, replaySeason, seasonFieldLock } from '../src/lockOps.js';

test('the lineup locks after both captains submit', () => {
  assert.equal(lineupLock({ submitted: true }, { submitted: true }).locked, true);
  assert.equal(lineupLock({ submitted: true }, { submitted: false }).locked, false);
});

test('functional health needs data, not only a shell', () => {
  assert.equal(functionalHealth({ name: 'schedule', data: true }).ok, true);
  assert.equal(functionalHealth({ name: 'schedule' }).ok, false);
});

test('a migration rehearsal names both states', () => {
  assert.equal(migrationRehearsal('v1', 'v2').ok, true);
  assert.equal(migrationRehearsal('v1', 'v1').ok, false);
});

test('an open season locks its name', () => {
  assert.equal(seasonFieldLock({ status: 'open' }, 'name').locked, true);
});

test('a replay counts wins', () => {
  assert.equal(replaySeason([{ winner: 'Owls' }, { winner: 'Owls' }]).Owls, 2);
});
