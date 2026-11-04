import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { collectJflSqlReviewContext as collect } from '../scripts/lib/jfl-sql-review-context.mjs';
import { jflSqlApprovalDigest } from '../scripts/lib/jfl-sql-manifest.mjs';
import { buildJflSqlTransportProbes } from '../scripts/lib/jfl-sql-transport-probes.mjs';

const now = Date.parse('2026-11-04T20:00:00Z');
const ref = id => `https://github.com/Fremont-Derby/fremontderby/issues/3686#issuecomment-${id}`;
function fixture(purpose = 'candidate-recovery') {
  const m = { schemaVersion: 1, card: 3686, purpose, project: 'oqkkvqkerusepyokzbmt', environment: 'jfl',
    healthUrl: 'https://jfl.fremontderby.com/health/environment', sourceSha: 'a'.repeat(40), expectedDeployedSha: 'b'.repeat(40),
    runId: '11111111-2222-4333-8444-555555555555', review: { jfl: ref(1),dru: ref(2) }, inventorySha256: 'c'.repeat(64) };
  if (purpose === 'transport-qualification') {
    m.probePlanSha256 = createHash('sha256').update(JSON.stringify(buildJflSqlTransportProbes({ runId: m.runId }))).digest('hex');
  }
  const block = lane => ({ schemaVersion: 1, lane, decision: 'AGREE', card: 3686, project: m.project,
    purpose, sourceSha: m.sourceSha, runId: m.runId, approvalSha256: jflSqlApprovalDigest(m) });
  const comments = ['JFL','DRU'].map((lane,i) => ({ id: i+1,
    issue_url: 'https://api.github.com/repos/Fremont-Derby/fremontderby/issues/3686',
    user: { login: 'subiki' },author_association: 'MEMBER',
    created_at: '2026-11-04T19:59:00Z',updated_at: '2026-11-04T19:59:01Z',
    body: '```jfl-sql-review\n'+JSON.stringify(block(lane))+'\n```' }));
  const health = { ok: true,environment: 'jfl',expectedSupabaseSchema: 'jfl',versionTag: m.expectedDeployedSha,
    checks: ['knownWorkerEnvironment','supabaseUrlUsesExpectedHost','supabaseProjectMatchesEnvironment',
      'supabaseSchemaMatchesEnvironment','expectedProjectRefIsolated','actualProjectIsolated'].map(name => ({ name,ok: true })) };
  const calls = [];
  return { m,comments,health,calls, clock: () => now,
    readComment: async id => { calls.push('comment:'+id); return comments[Number(id)-1]; },
    readHealth: async url => { calls.push(url); return health; } };
}
const run = f => collect({ manifestBytes: Buffer.from(JSON.stringify(f.m)),expectedSourceSha: f.m.sourceSha,
  clock: f.clock,readComment: f.readComment,readHealth: f.readHealth });
const mutateReview = (f,key,value) => {
  const original = JSON.parse(f.comments[1].body.split('\n')[1]);
  f.comments[1].body = '```jfl-sql-review\n'+JSON.stringify({ ...original,[key]: value })+'\n```';
};

for (const purpose of ['candidate-recovery','transport-qualification']) {
  test(`${purpose}: exact read-only attestations bind the proposal without inventing execution evidence`, async () => {
    const f = fixture(purpose), context = await run(f);
    assert.equal(context.approvalSha256,jflSqlApprovalDigest(f.m));
    assert.equal(context.executionAuthorized,false);
    assert.equal(context.witnesses.length,2);
    for (const key of ['exclusionId','transportQualification','qualifiedFraming','unusedMigrationNames']) {
      assert.equal(Object.hasOwn(context,key),false,key);
    }
    assert.deepEqual(f.calls,['comment:1','comment:2',f.m.healthUrl]);
    f.health.checks[0].ok = false;
    assert.equal(context.health.body.checks[0].ok,true);
    assert.throws(() => { context.health.body.checks[0].ok = false; },TypeError);
  });
}
test('missing or alternate-host attestations stop before any provider request', async () => {
  for (const value of [undefined,ref(1),ref(2).replace('github.com','example.invalid')]) {
    const f = fixture(); f.m.review.dru = value;
    await assert.rejects(run(f),/JFL_SQL_REVIEWS_MISSING_ATTESTATIONS/);
    assert.deepEqual(f.calls,[]);
  }
});
for (const [name,mutate] of Object.entries({
  'wrong comment': f => { f.comments[1].id = 3; },
  'wrong issue': f => { f.comments[1].issue_url += '/other'; },
  'unknown author': f => { f.comments[1].user.login = 'outside'; },
  'untrusted association': f => { f.comments[1].author_association = 'CONTRIBUTOR'; },
  'future edit': f => { f.comments[1].updated_at = '2026-11-05T00:00:00Z'; },
  'invalid timestamp': f => { f.comments[1].created_at = '1'; },
  'duplicate blocks': f => { f.comments[1].body += '\n'+f.comments[1].body; },
  'prose alone': f => { f.comments[1].body = 'DRU AGREE'; },
  'malformed block': f => { f.comments[1].body = '```jfl-sql-review\n{\n```'; },
  'wrong lane': f => mutateReview(f,'lane','JFL'),
  'disagreement': f => mutateReview(f,'decision','DISAGREE'),
  'another project': f => mutateReview(f,'project','production'),
  'another source': f => mutateReview(f,'sourceSha','d'.repeat(40)),
  'another run': f => mutateReview(f,'runId','another'),
  'another purpose': f => mutateReview(f,'purpose','other'),
  'another approval': f => mutateReview(f,'approvalSha256','d'.repeat(64)),
})) {
  test(`${name} cannot produce review context or fetch health`, async () => {
    const f = fixture(); mutate(f);
    await assert.rejects(run(f),/^Error: JFL_SQL_REVIEWS_[A-Z_]+$/);
    assert.equal(f.calls.some(call => call.startsWith('https:')),false);
  });
}
test('unreviewed content, target/source changes and stale probe plans are refused', async () => {
  const f = fixture(); f.m.additionalInstruction = 'different proposal';
  await assert.rejects(run(f),/JFL_SQL_REVIEWS_ATTESTATION/);
  const p = fixture('transport-qualification'); p.m.probePlanSha256 = '0'.repeat(64);
  await assert.rejects(run(p),/JFL_SQL_REVIEWS_PROBE_PLAN/); assert.deepEqual(p.calls,[]);
  const t = fixture(); t.m.healthUrl += '/other';
  await assert.rejects(run(t),/JFL_SQL_REVIEWS_TARGET/); assert.deepEqual(t.calls,[]);
  await assert.rejects(collect({ manifestBytes: Buffer.from(JSON.stringify(fixture().m)),expectedSourceSha: '0'.repeat(40) }),/JFL_SQL_REVIEWS_SOURCE/);
});
test('failed lookup/429 and failed or wrong-identity health have no retries or raw diagnostics', async () => {
  const f = fixture(); let requests = 0;
  f.readComment = async () => { requests++; throw new Error('HTTP429 private diagnostic'); };
  await assert.rejects(run(f),/^Error: JFL_SQL_REVIEWS_LOOKUP_FAILED$/); assert.equal(requests,2);
  for (const mutate of [h => { h.versionTag = null; },h => { h.checks.pop(); },h => { h.checks[0].ok = false; }]) {
    const bad = fixture(); mutate(bad.health);
    await assert.rejects(run(bad),/^Error: JFL_SQL_REVIEWS_HEALTH$/);
  }
  const failed = fixture(); failed.readHealth = async () => { throw new Error('private'); };
  await assert.rejects(run(failed),/^Error: JFL_SQL_REVIEWS_HEALTH_FAILED$/);
});
test('health timestamp records completion and a backwards clock refuses the result', async () => {
  const f = fixture(); let tick = 0; f.clock = () => now+(tick++ ? 3000 : 0);
  const result = await run(f);
  assert.equal(result.health.observedAt,new Date(now+3000).toISOString());
  const back = fixture(); let n = 0; back.clock = () => now-(n++ ? 1 : 0);
  await assert.rejects(run(back),/JFL_SQL_REVIEWS_TIME/);
});
test('malformed, oversized or deeply nested proposals fail before providers with sanitized errors', async () => {
  const f = fixture();
  for (const bytes of [Buffer.from([255]),Buffer.alloc(65537),Buffer.from('null'),Buffer.from('{')]) {
    await assert.rejects(collect({ manifestBytes: bytes }),/^Error: JFL_SQL_REVIEWS_MANIFEST$/);
  }
  let extra = null; for (let i=0;i<40;i++) extra = { nested: extra };
  f.m.extra = extra;
  await assert.rejects(run(f),/^Error: JFL_SQL_REVIEWS_MANIFEST$/); assert.deepEqual(f.calls,[]);
});
