import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPlayerRatingSeed, ratingSourceLabel } from '../src/ratingDisplay.js';

test('ratingSourceLabel never calls Derby estimate Official Fargo', () => {
  assert.equal(ratingSourceLabel('official_fargo'), 'Official Fargo');
  assert.equal(ratingSourceLabel('established'), 'Official Fargo');
  assert.equal(ratingSourceLabel('derby_estimate'), 'Derby estimate');
  assert.equal(ratingSourceLabel('admin_provisional'), 'Admin provisional');
  assert.equal(ratingSourceLabel('provisional'), 'Admin provisional');
  assert.equal(ratingSourceLabel('unverified'), 'Unverified');
  assert.equal(ratingSourceLabel(''), 'Unknown');
  assert.equal(ratingSourceLabel(null), 'Unknown');
  assert.equal(ratingSourceLabel('custom_source'), 'custom_source');
});

test('formatPlayerRatingSeed joins rating, source, robustness, confidence', () => {
  assert.equal(formatPlayerRatingSeed({}), 'No rating on file');
  assert.equal(formatPlayerRatingSeed({ rating: null }), 'No rating on file');
  assert.equal(
    formatPlayerRatingSeed({ rating: 512, source: 'derby_estimate' }),
    '512 · Derby estimate',
  );
  assert.equal(
    formatPlayerRatingSeed({
      rating: 600,
      source: 'official_fargo',
      robustness: 0.8,
      confidence: 'high',
    }),
    '600 · Official Fargo · Robustness 0.8 · high confidence',
  );
  assert.equal(
    formatPlayerRatingSeed({ rating: 400, status: 'provisional' }),
    '400 · Admin provisional',
  );
});
