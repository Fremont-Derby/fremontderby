import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const REQUIRED = [
  ['ci.yml', 'CI'],
  ['pr-card-contract.yml', 'PR card contract'],
  ['lane-health-monitor.yml', 'Lane health monitor'],
  ['release-source-policy.yml', 'Release source policy'],
  ['public-surface-canary.yml', 'Public surface canary'],
  ['restore-lane-custom-domains.yml', 'Restore lane custom domains'],
  ['diagnose-worker-domains.yml', 'Diagnose worker domains'],
  ['enforce-workers-dev-disabled.yml', 'Enforce workers.dev disabled'],
];

test('required workflow files exist with expected names', () => {
  for (const [file, name] of REQUIRED) {
    const path = join(root, '.github/workflows', file);
    assert.ok(existsSync(path), file);
    const src = readFileSync(path, 'utf8');
    assert.match(src, new RegExp(`^name:\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'), file);
  }
});
