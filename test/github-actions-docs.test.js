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

test('CI validates pull requests and integration pushes without deploying from PR events', () => {
  const text = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(text, /Safe public-repo CI/);
  assert.match(text, /#872/);
  assert.match(text, /workflow_dispatch:/);
  const onBlock = text.split('permissions:')[0];
  assert.match(onBlock, /\bpull_request\b/);
  assert.match(onBlock, /\bpush\b/);
  const deployBlock = text.slice(text.indexOf('deploy-nonproduction:'));
  assert.match(deployBlock, /github\.event_name == 'push'/);
  assert.match(deployBlock, /never on pull_request/);
});
