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

test('CI remains dispatch-only while POC mode comment is present', () => {
  const text = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(text, /POC mode/);
  assert.match(text, /workflow_dispatch:/);
  // No automatic PR/push triggers on main while runners are broken
  const onBlock = text.split('permissions:')[0];
  assert.doesNotMatch(onBlock, /\bpull_request\b/);
  assert.doesNotMatch(onBlock, /\bpush\b/);
});
