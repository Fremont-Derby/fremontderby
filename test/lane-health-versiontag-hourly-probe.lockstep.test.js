import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { evaluateLaneHealthBody } from '../scripts/assert-lane-health.mjs';
import {
  DEFAULT_PROBE_HOSTS,
  DEFAULT_PROBE_PATHS,
} from '../src/hourlyProbe.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('evaluateLaneHealthBody ignores versionTag when not requested', () => {
  const result = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'dru' }),
  );
  assert.equal(result.ok, true);
});

test('evaluateLaneHealthBody optionally requires matching versionTag', () => {
  const missing = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'dru' }),
    { expectedVersionTag: 'abc123' },
  );
  assert.equal(missing.ok, false);
  assert.match(missing.error, /reported none/);

  const mismatch = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'dru', versionTag: 'zzz' }),
    { expectedVersionTag: 'abc123' },
  );
  assert.equal(mismatch.ok, false);
  assert.match(mismatch.error, /versionTag="zzz"/);

  const ok = evaluateLaneHealthBody(
    'dru.fremontderby.com',
    'dru',
    200,
    JSON.stringify({ ok: true, environment: 'dru', versionTag: 'abc123def' }),
    { expectedVersionTag: 'abc123' },
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.versionTag, 'abc123def');
});

test('DEFAULT_PROBE_HOSTS and DEFAULT_PROBE_PATHS inventories stay public-surface aligned', () => {
  assert.deepEqual([...DEFAULT_PROBE_HOSTS], ['https://fremontderby.com']);
  assert.ok(DEFAULT_PROBE_PATHS.includes('/'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/schedule'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/teams'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/playoffs'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/trades'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/prizes'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/admin/audit'));
  assert.ok(DEFAULT_PROBE_PATHS.includes('/notifications'));
});

test('wrangler hourly cron remains 0 * * * * and routerEntry wires scheduled', () => {
  const wrangler = readFileSync(join(root, 'wrangler.jsonc'), 'utf8');
  const entry = readFileSync(join(root, 'src/routerEntry.js'), 'utf8');
  assert.ok(/"crons"\s*:\s*\[\s*"0 \* \* \* \*"\s*\]/.test(wrangler) || wrangler.includes('0 * * * *'));
  assert.ok(entry.includes('async scheduled('));
  assert.ok(entry.includes('runHourlyProbes'));
});
