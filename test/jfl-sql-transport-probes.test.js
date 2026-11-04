import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildJflSqlTransportProbes as build } from '../scripts/lib/jfl-sql-transport-probes.mjs';

test('probe identifiers reject injection, unknown/missing run IDs and non-v4 UUIDs', () => {
  for (const input of [undefined,{}, { runId: null },{ runId: "x';drop schema dru cascade;--" },
    { runId: '11111111-2222-3333-8444-555555555555' }]) {
    assert.throws(() => build(input), /^Error: JFL_SQL_PROBE_INVALID_RUN$/);
  }
});
test('exact immutable UTF8 payload pins are reproducible and distinct for another run', () => {
  const p = build({ runId: '11111111-2222-4333-8444-555555555555' });
  assert.equal(p.executionAuthorized,false);
  assert.deepEqual(p,build({ runId: p.runId }));
  const next = build({ runId: '11111111-2222-4333-8444-555555555556' });
  assert.equal(new Set([...Object.values(p.migrationNames),...Object.values(next.migrationNames)]).size,12);
  for (const [name,sql] of Object.entries(p.payloads)) {
    assert.equal(createHash('sha256').update(Buffer.from(sql,'utf8')).digest('hex'),p.digests[name]);
    assert.notEqual(p.digests[name],next.digests[name]);
  }
  assert.ok(Object.isFrozen(p) && Object.isFrozen(p.payloads) && Object.isFrozen(p.digests) && Object.isFrozen(p.migrationNames));
  assert.throws(() => { p.payloads.cleanup = 'select 1'; },TypeError);
});
