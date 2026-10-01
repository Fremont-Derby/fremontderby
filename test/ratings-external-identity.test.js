import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20260816260000_player_external_identities_and_rating_observations.sql', import.meta.url),
  'utf8',
);

test('external identities enforce unique provider+external_id', () => {
  assert.match(sql, /player_external_identities/);
  assert.match(sql, /unique \(provider, external_id\)/);
  assert.match(sql, /provider in \('fargo'/);
});

test('rating observations are append-only style with source kinds', () => {
  assert.match(sql, /rating_observations/);
  assert.match(sql, /official_fargo/);
  assert.match(sql, /derby_estimate/);
  assert.match(sql, /admin_provisional/);
  assert.match(sql, /record_rating_observation/);
  assert.match(sql, /apply_latest_rating_observation/);
});

test('player_ratings carries source provenance fields', () => {
  assert.match(sql, /rating_source/);
  assert.match(sql, /robustness/);
  assert.match(sql, /last_observation_id/);
});

import { ratingSourceLabel, formatPlayerRatingSeed } from '../src/ratingDisplay.js';

test('rating labels never call estimates official Fargo', () => {
  assert.equal(ratingSourceLabel('official_fargo'), 'Official Fargo');
  assert.equal(ratingSourceLabel('derby_estimate'), 'Derby estimate');
  assert.equal(ratingSourceLabel('admin_provisional'), 'Admin provisional');
  assert.match(formatPlayerRatingSeed({ rating: 520, source: 'derby_estimate', robustness: 0.4 }), /Derby estimate/);
  assert.doesNotMatch(formatPlayerRatingSeed({ rating: 520, source: 'derby_estimate' }), /Official Fargo/);
});
