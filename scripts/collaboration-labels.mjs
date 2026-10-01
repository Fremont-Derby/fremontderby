import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_LABELS = [
  'agent:unclaimed',
  'agent:jfl',
  'agent:dru',
  'stage:ready',
  'stage:claimed',
  'stage:in-progress',
  'stage:handoff',
  'stage:merge-ready',
  'stage:merged',
  'stage:verified',
  'stage:closed',
  'priority:p0',
  'priority:p1',
  'priority:p2',
  'priority:p3',
  'handoff:jfl',
  'handoff:dru',
  'handoff:review',
  'blocked',
  'collision-risk',
  'human-required',
];

const MANIFEST_URL = new URL('../.github/collaboration-labels.json', import.meta.url);

export function validateLabelManifest(manifest) {
  const errors = [];
  if (!manifest || manifest.version !== 1 || !Array.isArray(manifest.labels)) {
    return ['Manifest must contain version 1 and a labels array.'];
  }

  const names = new Set();
  for (const [index, label] of manifest.labels.entries()) {
    const location = `labels[${index}]`;
    if (!label || typeof label !== 'object') {
      errors.push(`${location} must be an object.`);
      continue;
    }
    if (typeof label.name !== 'string' || !label.name || label.name !== label.name.toLowerCase()) {
      errors.push(`${location}.name must be a non-empty lowercase string.`);
    } else if (names.has(label.name)) {
      errors.push(`Duplicate label name: ${label.name}.`);
    } else {
      names.add(label.name);
    }
    if (typeof label.color !== 'string' || !/^[0-9a-f]{6}$/.test(label.color)) {
      errors.push(`${location}.color must be six lowercase hexadecimal characters.`);
    }
    if (typeof label.description !== 'string' || !label.description.trim() || label.description.length > 100) {
      errors.push(`${location}.description must contain 1-100 characters.`);
    }
  }

  for (const required of REQUIRED_LABELS) {
    if (!names.has(required)) errors.push(`Missing required label: ${required}.`);
  }
  if (![...names].some((name) => name.startsWith('area:'))) {
    errors.push('Manifest must define at least one area:* label.');
  }

  return errors;
}

export function buildLabelSyncPlan(desiredLabels, existingLabels) {
  const existingByName = new Map(existingLabels.map((label) => [label.name, label]));
  const create = [];
  const update = [];

  for (const desired of desiredLabels) {
    const existing = existingByName.get(desired.name);
    if (!existing) {
      create.push(desired);
      continue;
    }
    if (
      String(existing.color).toLowerCase() !== desired.color
      || (existing.description ?? '') !== desired.description
    ) {
      update.push({ currentName: existing.name, ...desired });
    }
  }

  return { create, update };
}

async function loadManifest() {
  return JSON.parse(await readFile(MANIFEST_URL, 'utf8'));
}

async function githubRequest(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${method} ${url} failed with HTTP ${response.status}: ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

export async function syncCollaborationLabels({ token, repository, apiUrl = 'https://api.github.com' }) {
  if (!token) throw new Error('GITHUB_TOKEN is required for label synchronization.');
  const [owner, repo] = String(repository).split('/');
  if (!owner || !repo) throw new Error('GITHUB_REPOSITORY must use owner/repository form.');

  const manifest = await loadManifest();
  const errors = validateLabelManifest(manifest);
  if (errors.length) throw new Error(errors.join('\n'));

  const base = `${apiUrl.replace(/\/$/, '')}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/labels`;
  const existing = await githubRequest(`${base}?per_page=100`, { token });
  const plan = buildLabelSyncPlan(manifest.labels, existing);

  for (const label of plan.create) {
    await githubRequest(base, { token, method: 'POST', body: label });
  }
  for (const label of plan.update) {
    await githubRequest(`${base}/${encodeURIComponent(label.currentName)}`, {
      token,
      method: 'PATCH',
      body: { new_name: label.name, color: label.color, description: label.description },
    });
  }

  return plan;
}

async function main() {
  const manifest = await loadManifest();
  const errors = validateLabelManifest(manifest);
  if (errors.length) throw new Error(errors.join('\n'));

  if (process.argv.includes('--sync')) {
    const plan = await syncCollaborationLabels({
      token: process.env.GITHUB_TOKEN,
      repository: process.env.GITHUB_REPOSITORY,
      apiUrl: process.env.GITHUB_API_URL,
    });
    console.log(`Collaboration labels synchronized: ${plan.create.length} created, ${plan.update.length} updated.`);
    return;
  }

  console.log(`Collaboration label manifest is valid (${manifest.labels.length} labels).`);
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
