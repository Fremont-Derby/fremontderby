import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractTrackingCardNumbers,
  findTrackingCardConflicts,
  validateAgentBranchOwnership,
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

function pullRequest(number, trackingCard, overrides = {}) {
  return {
    number,
    body: validBody({ 'Tracking card': trackingCard }),
    html_url: `https://github.com/subiki/fremontderby/pull/${number}`,
    ...overrides,
  };
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

test('reports another open PR that owns the same tracking card', () => {
  assert.deepEqual(findTrackingCardConflicts({
    currentPullRequestNumber: 595,
    currentBody: validBody({ 'Tracking card': 'Tracks #574' }),
    openPullRequests: [
      pullRequest(592, 'Tracks #574'),
      pullRequest(590, 'Tracks #590'),
    ],
    repositoryFullName: REPOSITORY,
  }), [{
    cardNumber: 574,
    pullRequestNumber: 592,
    url: 'https://github.com/subiki/fremontderby/pull/592',
  }]);
});

test('uses the canonical same-repository parser for conflict checks', () => {
  assert.deepEqual(findTrackingCardConflicts({
    currentPullRequestNumber: 595,
    currentBody: validBody({ 'Tracking card': 'Tracks #574' }),
    openPullRequests: [
      pullRequest(593, 'Refs https://github.com/SUBIKI/FremontDerby/issues/574'),
      pullRequest(591, 'Refs https://github.com/another/repository/issues/574'),
    ],
    repositoryFullName: REPOSITORY,
  }).map((conflict) => conflict.pullRequestNumber), [593]);
});

test('excludes the current PR and PRs that track different cards', () => {
  assert.deepEqual(findTrackingCardConflicts({
    currentPullRequestNumber: 595,
    currentBody: validBody({ 'Tracking card': 'Tracks #595' }),
    openPullRequests: [
      pullRequest(595, 'Tracks #595'),
      pullRequest(594, 'Tracks #574'),
    ],
    repositoryFullName: REPOSITORY,
  }), []);
});


test('accepts JFL and DRU PRs only in their own branch namespaces', () => {
  assert.deepEqual(validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'JFL' }),
    'jfl/issue-629-immutable-agent-branches',
  ), []);
  assert.deepEqual(validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'DRU' }),
    'dru/issue-629-immutable-agent-branches',
  ), []);
});

test('rejects JFL and DRU PRs outside their own branch namespaces', () => {
  assert.ok(validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'JFL' }),
    'dru/issue-629-immutable-agent-branches',
  ).some((error) => error.includes('JFL-owned PRs')));
  assert.ok(validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'DRU' }),
    'jfl/issue-629-immutable-agent-branches',
  ).some((error) => error.includes('DRU-owned PRs')));
});

test('rejects non-owners using JFL or DRU branch namespaces', () => {
  assert.ok(validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'Orchestrator / ChatGPT' }),
    'jfl/issue-629-immutable-agent-branches',
  ).some((error) => error.includes('Only a PR whose owner lane is JFL')));
  assert.ok(validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'Orchestrator / ChatGPT' }),
    'dru/issue-629-immutable-agent-branches',
  ).some((error) => error.includes('Only a PR whose owner lane is DRU')));
});

test('rejects ambiguous JFL and DRU co-ownership', () => {
  const errors = validateAgentBranchOwnership(
    validBody({ 'Owner lane / agent': 'JFL / DRU' }),
    'jfl/issue-629-immutable-agent-branches',
  );
  assert.deepEqual(errors, ['Owner lane / agent must name only one of JFL or DRU.']);
});
