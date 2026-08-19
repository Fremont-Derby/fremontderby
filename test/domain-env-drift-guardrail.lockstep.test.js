import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  collectDomainEnvDrift,
  assertDomainEnvDrift,
} from '../scripts/assert-domain-env-drift.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseJsonc(text) {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return JSON.parse(stripped);
}

test('current repo inventories pass domain/env drift guardrail', () => {
  const wranglerConfig = parseJsonc(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  const result = collectDomainEnvDrift({ wranglerConfig });
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.doesNotThrow(() => assertDomainEnvDrift({ wranglerConfig }));
});

test('package and CI can invoke the drift script', () => {
  assert.ok(existsSync(join(root, 'scripts/assert-domain-env-drift.mjs')));
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['check:domain-env'], 'node scripts/assert-domain-env-drift.mjs');
  const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.ok(ci.includes('check:domain-env') || ci.includes('assert-domain-env-drift.mjs'));
});
