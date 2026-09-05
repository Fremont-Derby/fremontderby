import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('GITHUB_ACTIONS inventory documents runner constraint and workflows', () => {
  const text = readFileSync(new URL('../docs/GITHUB_ACTIONS.md', import.meta.url), 'utf8');
  assert.match(text, /runner_id: 0/);
  assert.match(text, /deploy-release-lanes\.yml/);
  assert.match(text, /workflow_dispatch/);
  assert.match(text, /Reactivation checklist/);
  assert.match(text, /Workers Builds/);
});

test('CI validates pull requests and pushes without deploying from the PR event', () => {
  const text = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(text, /workflow_dispatch:/);
  assert.match(text, /\bpull_request\b/);
  assert.match(text, /\bpush\b/);
  assert.match(text, /never on pull_request/);
});
