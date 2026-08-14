import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractTrackingCardNumbers,
  validatePullRequestBody,
} from '../scripts/check-pr-card-contract.mjs';

const REPOSITORY = 'subiki/fremontderby';

function validBody(overrides = {}) {
  const sections = {
    'Tracking card': 'Tracks #584',
    'Owner lane / agent': 'Orchestrator / ChatGPT',
    'Touched surfaces': 'Issue template, PR process workflow, validator, and tests.',
    'Out of scope': 'Runtime, database, deployment, and product behavior.',
    Proof: 'Focused unit tests and required repository CI.',
    Handoff: 'QA / Release reviews the workflow and required check behavior.',
    ...overrides,
  };

  return Object.entries(sections)
    .map(([heading, content]) => `## ${heading}\n${content}`)
    .join('\n\n');
}

test('accepts a complete PR body with a short same-repository reference', () => {
  assert.deepEqual(validatePullRequestBody(validBody(), REPOSITORY), []);
});

test('extracts and deduplicates short and local full-URL card numbers', () => {
  const body = [
    'Tracks #584',
    'Refs #585',
    'Refs https://github.com/SUBIKI/FremontDerby/issues/584',
  ].join('\n');

  assert.deepEqual(extractTrackingCardNumbers(body, REPOSITORY), [584, 585]);
});

test('ignores cross-repository full issue URLs', () => {
  const body = 'Tracks https://github.com/another/repository/issues/584';
  assert.deepEqual(extractTrackingCardNumbers(body, REPOSITORY), []);
});

test('rejects a tracking section containing only a cross-repository URL', () => {
  const errors = validatePullRequestBody(validBody({
    'Tracking card': 'Tracks https://github.com/another/repository/issues/584',
  }), REPOSITORY);

  assert.ok(errors.some((error) => error.includes('Tracking card')));
});

test('rejects missing tracking references and empty template sections', () => {
  const errors = validatePullRequestBody(validBody({
    'Tracking card': '<!-- Tracks #123 -->',
    Proof: '<!-- tests go here -->',
  }), REPOSITORY);

  assert.ok(errors.some((error) => error.includes('Tracking card')));
  assert.ok(errors.some((error) => error.includes('Proof')));
});

test('rejects automatic close keywords', () => {
  const errors = validatePullRequestBody(validBody({ 'Tracking card': 'Closes #584\nTracks #584' }), REPOSITORY);
  assert.ok(errors.some((error) => error.includes('Automatic close keywords')));
});
