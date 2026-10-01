import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapStatus, durableBinding, onionPages, opposingLineup, teamIdentity } from '../src/teamOps.js';

test('a locked team cannot be renamed', () => {
  assert.equal(teamIdentity({ locked: true }, 'Sharks').changed, false);
});

test('scoring needs both lineups', () => {
  assert.equal(opposingLineup({ name: 'Owls', players: ['Eli'] }, { name: 'Sharks', players: ['Mina'] }).ready, true);
  assert.equal(opposingLineup({ name: 'Owls', players: [] }, { name: 'Sharks', players: ['Mina'] }).ready, false);
});

test('season bootstrap must not be a 405', () => {
  assert.equal(bootstrapStatus(405).ok, false);
  assert.equal(bootstrapStatus(200).ok, true);
});

test('a durable binding needs a name', () => {
  assert.equal(durableBinding('SUPABASE_URL').ok, true);
  assert.equal(durableBinding('').ok, false);
});

test('the onion list names the main pages', () => {
  assert.ok(onionPages().includes('scorecard'));
});
