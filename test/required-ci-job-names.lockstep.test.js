import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Branch protection required status checks (docs/GITHUB_ACTIONS.md):
 *   test, accessibility, pr-card-contract, validate
 *
 * These names must remain stable; renaming a job silently breaks the
 * required-check gate on main.
 */
const REQUIRED_STATUS_CHECKS = Object.freeze([
  'test',
  'accessibility',
  'pr-card-contract',
  'validate',
]);

function jobNamesFromWorkflow(yamlText) {
  const names = [];
  // Match "name: foo" under jobs: (indentation-aware enough for our workflows)
  const jobBlock = yamlText.match(/^jobs:\s*\n([\s\S]*?)(?=^\S|\Z)/m);
  if (!jobBlock) return names;
  const re = /^\s{2}\w[\w-]*:\s*\n(?:\s{4}.*\n)*?\s{4}name:\s*([^\n]+)/gm;
  let m;
  while ((m = re.exec(jobBlock[1])) !== null) {
    names.push(m[1].trim());
  }
  // Fallback: top-level job key when no explicit name: (defaults to key)
  const keyRe = /^\s{2}([\w-]+):\s*$/gm;
  while ((m = keyRe.exec(jobBlock[1])) !== null) {
    const key = m[1];
    // Only add if we did not already capture an explicit name for a job
    if (!names.includes(key) && !names.some((n) => n === key)) {
      // Check whether this key has a name: child; if not, the key is the name
      const hasName = new RegExp(`^\\s{2}${key}:\\s*\\n(?:\\s{4}.*\\n)*?\\s{4}name:`, 'm').test(
        jobBlock[1],
      );
      if (!hasName) names.push(key);
    }
  }
  return [...new Set(names)];
}

test('REQUIRED_STATUS_CHECKS inventory is non-empty and stable', () => {
  assert.ok(REQUIRED_STATUS_CHECKS.length >= 4);
  assert.deepEqual([...REQUIRED_STATUS_CHECKS].sort(), [
    'accessibility',
    'pr-card-contract',
    'test',
    'validate',
  ]);
});

test('ci.yml exposes required job names test and accessibility', () => {
  const text = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const names = jobNamesFromWorkflow(text);
  assert.ok(names.includes('test'), `ci.yml jobs must include "test"; got ${JSON.stringify(names)}`);
  assert.ok(
    names.includes('accessibility'),
    `ci.yml jobs must include "accessibility"; got ${JSON.stringify(names)}`,
  );
});

test('pr-card-contract.yml job name is pr-card-contract', () => {
  const text = readFileSync(
    new URL('../.github/workflows/pr-card-contract.yml', import.meta.url),
    'utf8',
  );
  const names = jobNamesFromWorkflow(text);
  assert.ok(
    names.includes('pr-card-contract'),
    `pr-card-contract.yml must name its job "pr-card-contract"; got ${JSON.stringify(names)}`,
  );
});

test('release-source-policy.yml job name is validate', () => {
  const text = readFileSync(
    new URL('../.github/workflows/release-source-policy.yml', import.meta.url),
    'utf8',
  );
  const names = jobNamesFromWorkflow(text);
  assert.ok(
    names.includes('validate'),
    `release-source-policy.yml must name its job "validate"; got ${JSON.stringify(names)}`,
  );
});

test('docs/GITHUB_ACTIONS.md lists the required check names', () => {
  const text = readFileSync(new URL('../docs/GITHUB_ACTIONS.md', import.meta.url), 'utf8');
  for (const name of REQUIRED_STATUS_CHECKS) {
    assert.match(
      text,
      new RegExp(`\\b${name}\\b`),
      `docs/GITHUB_ACTIONS.md must mention required check "${name}"`,
    );
  }
  assert.match(
    text,
    /Required check names for branch protection/,
    'docs must retain the branch-protection required-check section',
  );
});
