import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePreGammaConvergence } from '../scripts/check-pre-gamma-convergence.mjs';

const BASE_SHA = '1'.repeat(40);
const HEAD_SHA = '2'.repeat(40);

function validBody(overrides = {}) {
  const fields = {
    'Convergence train': '#1847',
    'Gamma baseline SHA': BASE_SHA,
    'Candidate SHA': HEAD_SHA,
    'Rollback SHA': BASE_SHA,
    'Train owner': 'JFL',
    'Peer verifier': 'DRU',
    'Selected cards': '#1801, #1802',
    'Owner-lane proof': 'https://github.com/Fremont-Derby/fremontderby/issues/1801#issuecomment-1',
    'Peer-lane proof': 'https://github.com/Fremont-Derby/fremontderby/issues/1802#issuecomment-2',
    'Shared surfaces': 'router and release metadata; promotion is ordered to avoid overlap',
    'Migrations/config': 'None',
    'Promotion order': '#1801 -> #1802',
    ...overrides,
  };

  return Object.entries(fields)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n');
}

function candidate(overrides = {}) {
  return {
    baseRef: 'fremontderby-gamma',
    baseSha: BASE_SHA,
    headRef: 'jfl/issue-1847-pre-gamma-convergence',
    headSha: HEAD_SHA,
    body: validBody(),
    ...overrides,
  };
}

test('accepts a JFL-owned train independently verified by DRU', () => {
  assert.deepEqual(validatePreGammaConvergence(candidate()), []);
});

test('accepts a DRU-owned train independently verified by JFL', () => {
  assert.deepEqual(validatePreGammaConvergence(candidate({
    headRef: 'dru/issue-1900-gamma-train',
    body: validBody({ 'Train owner': 'DRU', 'Peer verifier': 'JFL' }),
  })), []);
});

test('skips pull requests that do not target Gamma', () => {
  assert.deepEqual(validatePreGammaConvergence(candidate({
    baseRef: 'main',
    body: '',
  })), []);
});

test('rejects a permanent lane branch as the promotion head', () => {
  const errors = validatePreGammaConvergence(candidate({ headRef: 'fremontderby-jfl' }));
  assert.ok(errors.some((error) => error.includes('permanent lane')));
  assert.ok(errors.some((error) => error.includes('focused')));
});

test('rejects same-lane verification and owner namespace mismatch', () => {
  const errors = validatePreGammaConvergence(candidate({
    body: validBody({ 'Train owner': 'DRU', 'Peer verifier': 'DRU' }),
  }));
  assert.ok(errors.some((error) => error.includes('opposite lane')));
  assert.ok(errors.some((error) => error.includes('namespace')));
});

test('rejects a train with more than four selected cards', () => {
  const errors = validatePreGammaConvergence(candidate({
    body: validBody({
      'Selected cards': '#1, #2, #3, #4, #5',
      'Promotion order': '#1 -> #2 -> #3 -> #4 -> #5',
    }),
  }));
  assert.ok(errors.some((error) => error.includes('2–4')));
});

test('rejects duplicate cards and an incomplete promotion order', () => {
  const errors = validatePreGammaConvergence(candidate({
    body: validBody({
      'Selected cards': '#1801, #1801, #1802',
      'Promotion order': '#1801',
    }),
  }));
  assert.ok(errors.some((error) => error.includes('duplicates')));
  assert.ok(errors.some((error) => error.includes('#1802')));
});

test('rejects stale or non-exact candidate identity', () => {
  const errors = validatePreGammaConvergence(candidate({
    body: validBody({
      'Gamma baseline SHA': 'not-a-sha',
      'Candidate SHA': '3'.repeat(40),
      'Rollback SHA': '4'.repeat(40),
    }),
  }));
  assert.ok(errors.some((error) => error.includes('Gamma baseline SHA')));
  assert.ok(errors.some((error) => error.includes('pull request head SHA')));
});

test('rejects rollback that does not return to the Gamma baseline', () => {
  const errors = validatePreGammaConvergence(candidate({
    body: validBody({ 'Rollback SHA': '4'.repeat(40) }),
  }));
  assert.ok(errors.some((error) => error.includes('equal the pinned Gamma baseline')));
});

test('rejects missing peer proof and placeholder operational metadata', () => {
  const errors = validatePreGammaConvergence(candidate({
    body: validBody({
      'Peer-lane proof': 'pending',
      'Shared surfaces': 'TBD',
      'Migrations/config': 'pending',
    }),
  }));
  assert.ok(errors.some((error) => error.includes('Peer-lane proof')));
  assert.ok(errors.some((error) => error.includes('Shared surfaces')));
  assert.ok(errors.some((error) => error.includes('Migrations/config')));
});
