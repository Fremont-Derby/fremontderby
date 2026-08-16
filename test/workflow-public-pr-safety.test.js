import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const files = readdirSync(new URL('../.github/workflows/', import.meta.url))
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

function read(name) {
  return readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8');
}

function codeOnly(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/#.*$/, ''))
    .join('\n');
}

test('no workflow triggers on untrusted base-ref PR event type', () => {
  for (const f of files) {
    const text = codeOnly(read(f));
    assert.doesNotMatch(text, /pull_request_target/, `${f} must not use untrusted base-ref PR triggers`);
  }
});

test('CI runs on pull_request without deploying from PR events', () => {
  const ci = read('ci.yml');
  assert.match(ci, /pull_request:/);
  assert.match(ci, /deploy-nonproduction/);
  const deployBlock = ci.slice(ci.indexOf('deploy-nonproduction:'));
  assert.match(deployBlock, /github\.event_name == 'push'/);
});

test('PR card contract is automatic and read-only', () => {
  const yml = read('pr-card-contract.yml');
  assert.match(yml, /pull_request:/);
  assert.doesNotMatch(codeOnly(yml), /CLOUDFLARE_/);
  assert.doesNotMatch(codeOnly(yml), /SUPABASE_/);
  assert.match(yml, /contents:\s*read/);
});

test('Deploy release lanes is workflow_dispatch only with trusted ref gate', () => {
  const yml = read('deploy-release-lanes.yml');
  assert.match(yml, /workflow_dispatch:/);
  assert.doesNotMatch(codeOnly(yml), /^\s*pull_request:/m);
  assert.match(yml, /Trusted ref gate/);
  assert.match(yml, /fremontderby-gamma/);
});
