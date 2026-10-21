import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GAMMA_BRANCH = 'fremontderby-gamma';
const PERMANENT_HEADS = new Set([
  'main',
  'fremontderby-jfl',
  'fremontderby-dru',
  'fremontderby-gamma',
]);
const EXACT_SHA = /^[0-9a-f]{40}$/i;
const ISSUE_BRANCH = /^(jfl|dru)\/issue-\d+-[a-z0-9][a-z0-9-]*$/;
const PROOF_URL = /^https:\/\/\S+$/i;
const PLACEHOLDER = /^(?:tbd|todo|pending|n\/a)$/i;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function field(body, name) {
  const match = String(body || '').match(new RegExp(
    `^${escapeRegex(name)}:\\s*(.+?)\\s*$`,
    'im',
  ));
  return match?.[1]?.trim() ?? '';
}

function lane(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'jfl') return 'jfl';
  if (normalized === 'dru') return 'dru';
  return '';
}

function requireSubstantiveField(body, name, errors) {
  const value = field(body, name);
  if (!value || PLACEHOLDER.test(value)) {
    errors.push(`${name} must contain explicit, non-placeholder evidence.`);
  }
  return value;
}

export function validatePreGammaConvergence({
  baseRef = '',
  baseSha = '',
  headRef = '',
  headSha = '',
  body = '',
} = {}) {
  if (baseRef !== GAMMA_BRANCH) return [];

  const errors = [];
  if (PERMANENT_HEADS.has(headRef)) {
    errors.push('Gamma promotion PRs must not use a permanent lane or release branch as their head.');
  }

  const branchMatch = headRef.match(ISSUE_BRANCH);
  if (!branchMatch) {
    errors.push('Gamma promotion PRs must use a focused `jfl/issue-<number>-<slug>` or `dru/issue-<number>-<slug>` head branch.');
  }

  const trainCard = field(body, 'Convergence train');
  if (!/^#\d+$/.test(trainCard)) {
    errors.push('Convergence train must reference exactly one repository issue as `#123`.');
  }

  const gammaBaseline = field(body, 'Gamma baseline SHA');
  if (!EXACT_SHA.test(gammaBaseline)) {
    errors.push('Gamma baseline SHA must be an exact 40-character commit SHA.');
  } else if (baseSha && gammaBaseline.toLowerCase() !== baseSha.toLowerCase()) {
    errors.push('Gamma baseline SHA must match the current pull request base SHA. Refresh the candidate from current Gamma.');
  }

  const candidateSha = field(body, 'Candidate SHA');
  if (!EXACT_SHA.test(candidateSha)) {
    errors.push('Candidate SHA must be an exact 40-character commit SHA.');
  } else if (headSha && candidateSha.toLowerCase() !== headSha.toLowerCase()) {
    errors.push('Candidate SHA must match the current pull request head SHA. Update proof after every candidate change.');
  }

  const rollbackSha = field(body, 'Rollback SHA');
  if (!EXACT_SHA.test(rollbackSha)) {
    errors.push('Rollback SHA must be an exact 40-character commit SHA.');
  } else if (EXACT_SHA.test(gammaBaseline) && rollbackSha.toLowerCase() !== gammaBaseline.toLowerCase()) {
    errors.push('Rollback SHA must equal the pinned Gamma baseline SHA.');
  }

  const ownerLane = lane(field(body, 'Train owner'));
  const peerLane = lane(field(body, 'Peer verifier'));
  if (!ownerLane) errors.push('Train owner must be exactly `JFL` or `DRU`.');
  if (!peerLane) errors.push('Peer verifier must be exactly `JFL` or `DRU`.');
  if (ownerLane && peerLane && ownerLane === peerLane) {
    errors.push('Peer verifier must be the opposite lane from the train owner.');
  }
  if (branchMatch && ownerLane && branchMatch[1] !== ownerLane) {
    errors.push('Train owner must match the JFL or DRU namespace of the promotion branch.');
  }

  const selectedCards = field(body, 'Selected cards');
  const cardMatches = [...selectedCards.matchAll(/#(\d+)/g)].map((match) => Number(match[1]));
  const uniqueCards = [...new Set(cardMatches)];
  if (cardMatches.length !== uniqueCards.length) {
    errors.push('Selected cards must not contain duplicates.');
  }
  if (uniqueCards.length < 2 || uniqueCards.length > 4) {
    errors.push('Selected cards must contain 2–4 distinct issue references.');
  }

  for (const name of ['Owner-lane proof', 'Peer-lane proof']) {
    const value = field(body, name);
    if (!PROOF_URL.test(value)) {
      errors.push(`${name} must be one HTTPS evidence URL.`);
    }
  }

  requireSubstantiveField(body, 'Shared surfaces', errors);
  requireSubstantiveField(body, 'Migrations/config', errors);
  const promotionOrder = requireSubstantiveField(body, 'Promotion order', errors);
  for (const cardNumber of uniqueCards) {
    if (!promotionOrder.includes(`#${cardNumber}`)) {
      errors.push(`Promotion order must include selected card #${cardNumber}.`);
    }
  }

  return errors;
}

function validateEventFile(eventPath) {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const pullRequest = event.pull_request ?? {};
  const errors = validatePreGammaConvergence({
    baseRef: pullRequest.base?.ref ?? '',
    baseSha: pullRequest.base?.sha ?? '',
    headRef: pullRequest.head?.ref ?? '',
    headSha: pullRequest.head?.sha ?? '',
    body: pullRequest.body ?? '',
  });

  if (errors.length > 0) {
    console.error([
      'Pre-Gamma convergence contract failed:',
      ...errors.map((error) => `- ${error}`),
    ].join('\n'));
    return 1;
  }

  console.log('Pre-Gamma convergence contract passed.');
  return 0;
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.error('GITHUB_EVENT_PATH is required.');
    process.exitCode = 1;
  } else {
    try {
      process.exitCode = validateEventFile(eventPath);
    } catch (error) {
      console.error(`Pre-Gamma convergence contract failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
