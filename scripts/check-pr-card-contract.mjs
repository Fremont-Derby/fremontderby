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
  return value.replace(/<!--[\s\S]*?-->/g, '').trim();
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

export function validatePullRequestBody(body = '', repositoryFullName = '') {
  const errors = [];
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

function validateEventFile(eventPath) {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const repositoryFullName = event.repository?.full_name ?? '';
  const body = event.pull_request?.body ?? '';
  const cardNumbers = extractTrackingCardNumbers(sectionContent(body, 'Tracking card'), repositoryFullName);
  const errors = validatePullRequestBody(body, repositoryFullName);

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
    process.exitCode = validateEventFile(eventPath);
  }
}
