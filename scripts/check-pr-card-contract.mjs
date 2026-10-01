import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUIRED_SECTIONS = [
  'Owner lane / agent',
  'Touched surfaces',
  'Out of scope',
  'Proof',
  'Handoff',
];

const TRACKING_REFERENCE = /\b(?:Tracks|Refs)\s+(?:#(\d+)|https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/issues\/(\d+))\b/gi;
const AUTO_CLOSE_REFERENCE = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+(?:#\d+|https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+)\b/i;

function withoutComments(value) {
  let out = String(value || '');
  let prev;
  do {
    prev = out;
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  } while (out !== prev);
  return out.trim();
}

function sectionContent(body, heading) {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (start === -1) return '';

  const nextHeading = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const end = nextHeading === -1 ? lines.length : nextHeading;
  return withoutComments(lines.slice(start + 1, end).join('\n'));
}

export function extractTrackingCardNumbers(body = '', repositoryFullName = '') {
  const normalizedRepository = repositoryFullName.toLowerCase();
  const numbers = new Set();

  for (const match of body.matchAll(TRACKING_REFERENCE)) {
    if (match[1]) {
      numbers.add(Number(match[1]));
      continue;
    }

    const referencedRepository = `${match[2]}/${match[3]}`.toLowerCase();
    if (referencedRepository === normalizedRepository) {
      numbers.add(Number(match[4]));
    }
  }

  return [...numbers];
}


export function validateTrackingCardLabels(labels = []) {
  const names = labels
    .map((label) => (typeof label === 'string' ? label : label?.name))
    .filter((name) => typeof name === 'string' && name.length > 0);
  const matching = (prefix) => names.filter((name) => name.startsWith(prefix));
  const owners = matching('agent:');
  const stages = matching('stage:');
  const priorities = matching('priority:');
  const areas = matching('area:');
  const handoffs = matching('handoff:');
  const errors = [];

  if (owners.length !== 1) {
    errors.push(`Tracking card must have exactly one agent:* owner label; found ${owners.length}.`);
  } else if (owners[0] === 'agent:unclaimed') {
    errors.push('Tracking card owner must accept the work before a PR opens; replace agent:unclaimed.');
  }

  if (stages.length !== 1) {
    errors.push(`Tracking card must have exactly one stage:* label; found ${stages.length}.`);
  } else if (!['stage:handoff', 'stage:merge-ready'].includes(stages[0])) {
    errors.push(`Open implementation PRs require stage:handoff or stage:merge-ready; found ${stages[0]}.`);
  }

  if (priorities.length !== 1) {
    errors.push(`Tracking card must have exactly one priority:* label; found ${priorities.length}.`);
  }
  if (areas.length === 0) {
    errors.push('Tracking card must have at least one area:* label.');
  }

  if (stages[0] === 'stage:handoff' && handoffs.length !== 1) {
    errors.push(`stage:handoff requires exactly one handoff:* target; found ${handoffs.length}.`);
  }
  if (stages[0] === 'stage:merge-ready' && handoffs.length > 0) {
    errors.push('stage:merge-ready cannot retain a pending handoff:* label.');
  }

  return errors;
}

export function findTrackingCardConflicts({
  currentPullRequestNumber,
  currentBody = '',
  openPullRequests = [],
  repositoryFullName = '',
} = {}) {
  const currentCards = new Set(extractTrackingCardNumbers(
    sectionContent(currentBody, 'Tracking card'),
    repositoryFullName,
  ));
  const conflicts = [];

  for (const pullRequest of openPullRequests) {
    if (Number(pullRequest.number) === Number(currentPullRequestNumber)) continue;

    const otherCards = extractTrackingCardNumbers(
      sectionContent(pullRequest.body ?? '', 'Tracking card'),
      repositoryFullName,
    );
    for (const cardNumber of otherCards) {
      if (!currentCards.has(cardNumber)) continue;
      conflicts.push({
        cardNumber,
        pullRequestNumber: Number(pullRequest.number),
        url: pullRequest.html_url ?? '',
      });
    }
  }

  return conflicts.sort((left, right) => (
    left.cardNumber - right.cardNumber
    || left.pullRequestNumber - right.pullRequestNumber
  ));
}

export function validateAgentBranchOwnership(body = '', headRef = '') {
  if (!headRef) return [];

  const errors = [];
  const owner = sectionContent(body, 'Owner lane / agent');
  const isJflOwner = /\bJFL\b/i.test(owner);
  const isDruOwner = /\bDRU\b/i.test(owner);
  const isJflBranch = headRef.startsWith('jfl/');
  const isDruBranch = headRef.startsWith('dru/');

  if (isJflOwner && isDruOwner) {
    errors.push('Owner lane / agent must name only one of JFL or DRU.');
    return errors;
  }

  if (isJflOwner && !isJflBranch) {
    errors.push('JFL-owned PRs must use a `jfl/issue-<number>-<slug>` head branch.');
  }
  if (isDruOwner && !isDruBranch) {
    errors.push('DRU-owned PRs must use a `dru/issue-<number>-<slug>` head branch.');
  }
  if (isJflBranch && !isJflOwner) {
    errors.push('Only a PR whose owner lane is JFL may use the `jfl/*` branch namespace.');
  }
  if (isDruBranch && !isDruOwner) {
    errors.push('Only a PR whose owner lane is DRU may use the `dru/*` branch namespace.');
  }

  return errors;
}

export function validatePullRequestBody(body = '', repositoryFullName = '', headRef = '') {
  const errors = [...validateAgentBranchOwnership(body, headRef)];
  const trackingSection = sectionContent(body, 'Tracking card');

  if (extractTrackingCardNumbers(trackingSection, repositoryFullName).length === 0) {
    errors.push('Tracking card must contain `Tracks #123` or `Refs #123` for this repository.');
  }

  if (AUTO_CLOSE_REFERENCE.test(withoutComments(body))) {
    errors.push('Automatic close keywords are not allowed; keep the card open through post-merge verification.');
  }

  for (const heading of REQUIRED_SECTIONS) {
    if (!sectionContent(body, heading)) {
      errors.push(`Section "${heading}" must contain non-placeholder content.`);
    }
  }

  return errors;
}

async function fetchOpenPullRequests(repositoryFullName, token, apiUrl = 'https://api.github.com') {
  if (!token) {
    throw new Error('GITHUB_TOKEN is required to check exclusive tracking-card ownership.');
  }

  const [owner, repository] = repositoryFullName.split('/');
  if (!owner || !repository) {
    throw new Error(`Invalid repository full name: "${repositoryFullName}".`);
  }

  const pullRequests = [];
  for (let page = 1; ; page += 1) {
    const url = new URL(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls`, apiUrl);
    url.searchParams.set('state', 'open');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub open-PR lookup failed with HTTP ${response.status}.`);
    }

    const pageItems = await response.json();
    pullRequests.push(...pageItems);
    if (pageItems.length < 100) break;
  }

  return pullRequests;
}

async function validateEventFile(eventPath) {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const repositoryFullName = event.repository?.full_name ?? '';
  const pullRequestNumber = event.pull_request?.number;
  const body = event.pull_request?.body ?? '';
  const cardNumbers = extractTrackingCardNumbers(sectionContent(body, 'Tracking card'), repositoryFullName);
  const errors = validatePullRequestBody(body, repositoryFullName, event.pull_request?.head?.ref ?? '');

  if (errors.length === 0) {
    const openPullRequests = await fetchOpenPullRequests(
      repositoryFullName,
      process.env.GITHUB_TOKEN,
      process.env.GITHUB_API_URL,
    );
    const conflicts = findTrackingCardConflicts({
      currentPullRequestNumber: pullRequestNumber,
      currentBody: body,
      openPullRequests,
      repositoryFullName,
    });
    for (const conflict of conflicts) {
      const target = conflict.url || `open PR #${conflict.pullRequestNumber}`;
      errors.push(`Tracking card #${conflict.cardNumber} is already owned by open PR #${conflict.pullRequestNumber} (${target}). Close or hand off the existing PR before continuing.`);
    }
  }

  if (errors.length > 0) {
    console.error(['PR card contract failed:', ...errors.map((error) => `- ${error}`)].join('\n'));
    return 1;
  }

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `tracking-card-numbers=${JSON.stringify(cardNumbers)}\n`);
  }

  console.log('PR card contract passed.');
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
      process.exitCode = await validateEventFile(eventPath);
    } catch (error) {
      console.error(`PR card contract failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
