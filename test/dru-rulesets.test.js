import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const integration = JSON.parse(
  readFileSync(resolve(root, '.github/rulesets/dru-integration.json'), 'utf8'),
);
const isolation = JSON.parse(
  readFileSync(resolve(root, '.github/rulesets/dru-identity-isolation.json'), 'utf8'),
);

test('DRU integration ruleset targets only fremontderby-dru and requires CI contexts', () => {
  assert.equal(integration.target, 'branch');
  assert.equal(integration.enforcement, 'active');
  assert.deepEqual(integration.conditions.ref_name.include, ['refs/heads/fremontderby-dru']);

  const statusRule = integration.rules.find((r) => r.type === 'required_status_checks');
  assert.ok(statusRule, 'required_status_checks rule must exist');
  const contexts = statusRule.parameters.required_status_checks.map((c) => c.context);
  assert.ok(contexts.includes('CI / test'));
  assert.ok(contexts.includes('PR card contract / validate'));
  assert.equal(statusRule.parameters.strict_required_status_checks_policy, true);

  const prRule = integration.rules.find((r) => r.type === 'pull_request');
  assert.ok(prRule);
  assert.deepEqual(prRule.parameters.allowed_merge_methods, ['squash']);
  assert.equal(prRule.parameters.required_review_thread_resolution, true);
});

test('DRU identity isolation restricts DRU refs to the DRU actor', () => {
  assert.equal(isolation.target, 'branch');
  assert.equal(isolation.enforcement, 'active');
  assert.ok(isolation.conditions.ref_name.include.includes('refs/heads/fremontderby-dru'));
  assert.ok(isolation.conditions.ref_name.include.some((r) => r.includes('dru/')));

  const bypass = isolation.bypass_actors.find((a) => a.actor_id === 316050091);
  assert.ok(bypass, 'DRU actor id 316050091 must be present');
  assert.equal(bypass.actor_type, 'User');

  const updateRule = isolation.rules.find((r) => r.type === 'update');
  assert.ok(updateRule);
  assert.equal(updateRule.parameters.update_allows_fetch_and_merge, false);
});
