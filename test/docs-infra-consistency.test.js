import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const environments = readFileSync(new URL('../docs/ENVIRONMENTS.md', import.meta.url), 'utf8');
const architecture = readFileSync(new URL('../docs/ARCHITECTURE.md', import.meta.url), 'utf8');
const actions = readFileSync(new URL('../docs/GITHUB_ACTIONS.md', import.meta.url), 'utf8');
const beta = readFileSync(new URL('../docs/beta-environment.md', import.meta.url), 'utf8');
const adr4 = readFileSync(new URL('../docs/adr/0004-deployment.md', import.meta.url), 'utf8');

test('environments doc describes shared staging schema partition', () => {
  assert.match(environments, /shared staging Supabase project/);
  assert.match(environments, /SUPABASE_SCHEMA/);
  assert.match(environments, /Accept-Profile/);
  assert.match(environments, /CLOUDFLARE_API_TOKEN/);
});

test('architecture no longer claims only a separate staging project without schemas', () => {
  assert.match(architecture, /per-lane Postgres schemas/);
  assert.doesNotMatch(architecture, /Staging:\*\* separate Supabase project\/data and separate Worker hostname\./);
});

test('github actions doc is dispatch-aware and names CF secrets', () => {
  assert.match(actions, /workflow_dispatch/);
  assert.match(actions, /ubuntu-latest/);
  assert.match(actions, /CLOUDFLARE_ACCOUNT_ID/);
});

test('beta pointer stays aligned with open-auth lanes', () => {
  assert.match(beta, /BETA_AUTH_BYPASS/);
  assert.match(beta, /dru\.fremontderby\.com/);
  assert.match(beta, /ENVIRONMENTS\.md/);
});

test('deployment ADR mentions schema partition and health identity', () => {
  assert.match(adr4, /Accept-Profile/);
  assert.match(adr4, /health\/environment/);
});
