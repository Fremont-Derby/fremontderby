import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractTrackingCardNumbers,
  findTrackingCardConflicts,
  validateAgentBranchOwnership,
  validateCurrentProgramTarget,
  validateDruSessionJournalComment,
  validateDruSessionJournalReference,
  validatePullRequestBody,
  validateTrackingCardLabels,
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


test('accepts valid handoff and merge-ready tracking-card labels', () => {
  assert.deepEqual(validateTrackingCardLabels([
    'agent:jfl',
    'stage:handoff',
    'priority:p1',
    'area:product',
    'area:qa',
    'handoff:review',
  ]), []);
  assert.deepEqual(validateTrackingCardLabels([
    'agent:dru',
    'stage:merge-ready',
    'priority:p0',
    'area:data',
  ]), []);
});

test('rejects missing, multiple, or unaccepted owners', () => {
  const noOwner = validateTrackingCardLabels([
    'stage:handoff',
    'priority:p1',
    'area:process',
    'handoff:review',
  ]);
  assert.ok(noOwner.some((error) => error.includes('exactly one agent:*')));

  const multipleOwners = validateTrackingCardLabels([
    'agent:jfl',
    'agent:dru',
    'stage:handoff',
    'priority:p1',
    'area:process',
    'handoff:review',
  ]);
  assert.ok(multipleOwners.some((error) => error.includes('found 2')));

  const unclaimed = validateTrackingCardLabels([
    'agent:unclaimed',
    'stage:handoff',
    'priority:p1',
    'area:process',
    'handoff:review',
  ]);
  assert.ok(unclaimed.some((error) => error.includes('replace agent:unclaimed')));
});

test('rejects invalid stage, priority, and area cardinality', () => {
  const errors = validateTrackingCardLabels([
    'agent:codex',
    'stage:in-progress',
    'stage:handoff',
    'priority:p1',
    'priority:p2',
    'handoff:review',
  ]);
  assert.ok(errors.some((error) => error.includes('exactly one stage:*')));
  assert.ok(errors.some((error) => error.includes('exactly one priority:*')));
  assert.ok(errors.some((error) => error.includes('at least one area:*')));
});

test('requires an accepted handoff state before merge readiness', () => {
  const missingTarget = validateTrackingCardLabels([
    'agent:codex',
    'stage:handoff',
    'priority:p1',
    'area:process',
  ]);
  assert.ok(missingTarget.some((error) => error.includes('exactly one handoff:*')));

  const staleTarget = validateTrackingCardLabels([
    'agent:codex',
    'stage:merge-ready',
    'priority:p1',
    'area:process',
    'handoff:review',
  ]);
  assert.ok(staleTarget.some((error) => error.includes('cannot retain')));
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


test('grandfathers DRU PRs created before the journal gate', () => {
  const result = validateDruSessionJournalReference(
    validBody({ 'Owner lane / agent': 'DRU' }),
    REPOSITORY,
    3013,
  );
  assert.deepEqual(result, { errors: [], commentId: null });
});

test('requires a direct #2883 comment link for new DRU PRs', () => {
  const missing = validateDruSessionJournalReference(
    validBody({ 'Owner lane / agent': 'DRU' }),
    REPOSITORY,
    3014,
  );
  assert.ok(missing.errors.some((error) => error.includes('DRU session journal')));

  const wrongIssue = validateDruSessionJournalReference(
    validBody({
      'Owner lane / agent': 'DRU',
      'DRU session journal': 'https://github.com/subiki/fremontderby/issues/999#issuecomment-12345',
    }),
    REPOSITORY,
    3014,
  );
  assert.ok(wrongIssue.errors.some((error) => error.includes('#2883')));

  const valid = validateDruSessionJournalReference(
    validBody({
      'Owner lane / agent': 'DRU',
      'DRU session journal': 'https://github.com/subiki/fremontderby/issues/2883#issuecomment-5964637419',
    }),
    REPOSITORY,
    3014,
  );
  assert.deepEqual(valid, { errors: [], commentId: 5964637419 });
});

test('does not impose the DRU journal section on JFL or other lanes', () => {
  assert.deepEqual(validateDruSessionJournalReference(
    validBody({ 'Owner lane / agent': 'JFL' }),
    REPOSITORY,
    9999,
  ), { errors: [], commentId: null });
});

test('verifies DRU journal author, issue, heading, and freshness', () => {
  const validComment = {
    issue_url: 'https://api.github.com/repos/subiki/fremontderby/issues/2883',
    user: { login: 'ctf-gooo-003' },
    body: '### Session contract\n- Current objective: one real DRU blocker.',
    created_at: '2026-10-03T06:00:00Z',
  };

  assert.deepEqual(validateDruSessionJournalComment({
    comment: validComment,
    pullRequestAuthor: 'ctf-gooo-003',
    pullRequestUpdatedAt: '2026-10-03T07:00:00Z',
  }), []);

  const wrongAuthor = validateDruSessionJournalComment({
    comment: validComment,
    pullRequestAuthor: 'someone-else',
    pullRequestUpdatedAt: '2026-10-03T07:00:00Z',
  });
  assert.ok(wrongAuthor.some((error) => error.includes('same GitHub identity')));

  const stale = validateDruSessionJournalComment({
    comment: validComment,
    pullRequestAuthor: 'ctf-gooo-003',
    pullRequestUpdatedAt: '2026-10-04T07:00:01Z',
  });
  assert.ok(stale.some((error) => error.includes('older than 24 hours')));

  const wrongHeading = validateDruSessionJournalComment({
    comment: { ...validComment, body: 'Session contract: one blocker' },
    pullRequestAuthor: 'ctf-gooo-003',
    pullRequestUpdatedAt: '2026-10-03T07:00:00Z',
  });
  assert.ok(wrongHeading.some((error) => error.includes('### Session contract')));
});


test('requires shared program fields on new DRU session contracts', () => {
  const base = {
    issue_url: 'https://api.github.com/repos/subiki/fremontderby/issues/2883',
    user: { login: 'ctf-gooo-003' },
    created_at: '2026-10-03T20:00:00Z',
  };

  const missing = validateDruSessionJournalComment({
    comment: {
      ...base,
      body: '### Session contract\n- Human direction: keep going',
    },
    pullRequestAuthor: 'ctf-gooo-003',
    pullRequestUpdatedAt: '2026-10-03T20:30:00Z',
    requireProgramFields: true,
  });
  assert.ok(missing.some((error) => error.includes('Shared objective')));
  assert.ok(missing.some((error) => error.includes('DRU contribution')));
  assert.ok(missing.some((error) => error.includes('JFL handoff')));
  assert.ok(missing.some((error) => error.includes('Done when')));

  assert.deepEqual(validateDruSessionJournalComment({
    comment: {
      ...base,
      body: [
        '### Session contract',
        '- **Shared objective:** captains complete a real JFL match.',
        '- **DRU contribution:** reproduce the first scoring blocker on DRU.',
        '- **JFL handoff:** reproduction, regression, and portable patch.',
        '- **Done when:** the real DRU path is verified and JFL has adoption evidence.',
      ].join('\n'),
    },
    pullRequestAuthor: 'ctf-gooo-003',
    pullRequestUpdatedAt: '2026-10-03T20:30:00Z',
    requireProgramFields: true,
  }), []);
});

test('blocks new DRU-to-Gamma promotion during the JFL completion phase', () => {
  const druBody = validBody({ 'Owner lane / agent': 'DRU' });

  assert.deepEqual(validateCurrentProgramTarget({
    body: druBody,
    baseRef: 'fremontderby-gamma',
    pullRequestNumber: 999999,
  }), []);

  assert.deepEqual(validateCurrentProgramTarget({
    body: druBody,
    baseRef: 'fremontderby-jfl',
    pullRequestNumber: 1000000,
  }), []);

  const blocked = validateCurrentProgramTarget({
    body: druBody,
    baseRef: 'fremontderby-gamma',
    pullRequestNumber: 1000000,
  });
  assert.ok(blocked.some((error) => error.includes('Gamma is dormant')));

  assert.deepEqual(validateCurrentProgramTarget({
    body: validBody({ 'Owner lane / agent': 'JFL' }),
    baseRef: 'fremontderby-gamma',
    pullRequestNumber: 1000000,
  }), []);
});
