import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  scrubSqlStatements,
  describeScrubPolicy,
} from '../scripts/gamma-refresh/scrub-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('scrub policy only targets gamma schema and nulls phone fields', () => {
  assert.ok(scrubSqlStatements.length >= 1);
  for (const sql of scrubSqlStatements) {
    assert.match(sql, /\bgamma\./);
    assert.ok(!/\bpublic\./.test(sql));
    assert.ok(!/\bjfl\./.test(sql));
    assert.ok(!/\bdru\./.test(sql));
  }
  assert.ok(scrubSqlStatements.some((s) => /phone\s*=\s*NULL/i.test(s)));
  const policy = describeScrubPolicy();
  assert.equal(policy.version, 1);
  assert.ok(policy.actions.some((a) => /one-way/i.test(a)));
  assert.ok(policy.actions.some((a) => /service-role/i.test(a)));
});

test('put-wrangler-secret uses classic secret put only (never versions secret put)', () => {
  const src = readFileSync(join(root, 'scripts/put-wrangler-secret.mjs'), 'utf8');
  assert.ok(src.includes("'secret', 'put'") || src.includes('secret", "put"') || /secret'\s*,\s*'put'/.test(src));
  assert.ok(src.includes('wrangler@4') || src.includes('wrangler'));
  assert.ok(/not falling back to versions secret put/i.test(src));
  assert.ok(!/versions'\s*,\s*'secret'/.test(src));
  assert.ok(!/versions secret put/.test(src.replace(/not falling back to versions secret put/i, '')));
});
