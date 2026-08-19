import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  validateRulesetConfig,
  loadRulesetConfig,
  REQUIRED_MAIN_CHECKS,
} from '../scripts/validate-ruleset-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, '.github/rulesets/fremontderby-rulesets.json');

test('ruleset config file exists and validates', () => {
  assert.ok(existsSync(configPath));
  const config = loadRulesetConfig(configPath);
  assert.deepEqual(validateRulesetConfig(config), []);
});

test('Main block requires the public PR safety check names', () => {
  const config = loadRulesetConfig(configPath);
  assert.deepEqual([...REQUIRED_MAIN_CHECKS].sort(), ['accessibility', 'pr-card-contract', 'test', 'validate'].sort());
  for (const check of REQUIRED_MAIN_CHECKS) {
    assert.ok(config.requiredStatusChecks.main.includes(check));
  }
  const main = config.rulesets.find((r) => r.name === 'Main block');
  assert.ok(main);
  assert.ok(main.conditions.ref_name.include.includes('refs/heads/main'));
});

test('Gamma and lane permanent branch rulesets are present', () => {
  const config = loadRulesetConfig(configPath);
  const names = config.rulesets.map((r) => r.name);
  assert.ok(names.includes('Gamma promotion'));
  assert.ok(names.includes('JFL permanent branch'));
  assert.ok(names.includes('DRU permanent branch'));
});

test('docs reference the ruleset config path', () => {
  const docs = readFileSync(join(root, 'docs/github-org-lane-identities.md'), 'utf8');
  assert.match(docs, /fremontderby-rulesets\.json/);
  assert.match(docs, /#1185/);
});
