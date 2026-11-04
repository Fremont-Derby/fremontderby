import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { prepareJflSqlExperiment as prepare, classifyJflSqlRunOutcome as classify, jflSqlApprovalDigest } from '../scripts/lib/jfl-sql-manifest.mjs';
import { collectJflSqlReviewContext } from '../scripts/lib/jfl-sql-review-context.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const inventoryBytes = await readFile(new URL('../scripts/sql/jfl-ordinary-score-ownership.artifacts.json', import.meta.url));
const inventory = JSON.parse(inventoryBytes);
const originalArtifacts = new Map(await Promise.all(Object.keys(inventory.artifacts).map(async file =>
  [file, await readFile(new URL('../'+file, import.meta.url))])));
const now = Date.parse('2026-11-04T19:30:00.000Z');
const iso = n => new Date(n).toISOString();
const agreement = n => `https://github.com/Fremont-Derby/fremontderby/issues/3686#issuecomment-${n}`;
const settings = "SET LOCAL lock_timeout = '2000ms';\nSET LOCAL statement_timeout = '30000ms';\nSET LOCAL idle_in_transaction_session_timeout = '40000ms';\n";
function fixture() {
  const m = {
    schemaVersion: 1, card: 3686, purpose: 'candidate-recovery', runId: '11111111-2222-4333-8444-555555555555',
    ownerLane: 'jfl', owner: 'test-owner-only', project: 'oqkkvqkerusepyokzbmt', environment: 'jfl',
    healthUrl: 'https://jfl.fremontderby.com/health/environment', schemas: ['jfl','jfl_private'],
    sourceSha: 'a'.repeat(40), expectedDeployedSha: 'b'.repeat(40),
    review: { jfl: agreement(1), dru: agreement(2) },
    exclusion: { id: 'test-interval-only', startsAt: iso(now-60000), endsAt: iso(now+600000), jfl: agreement(1), dru: agreement(2) },
    timeouts: { lockMs: 2000, statementMs: 30000, idleMs: 40000, clientMs: 60000 },
    transport: { kind: 'supabase-mcp-apply-migration', framing: 'service-owned', qualification: agreement(3) },
    history: { installName: 'jfl_3686_test_install', recoveryName: 'jfl_3686_test_recover', treatment: 'retain-records' },
    inventorySha256: hash(inventoryBytes),
    payloadSha256: {
      install: hash(settings + originalArtifacts.get('scripts/sql/jfl-ordinary-score-ownership.candidate.sql').toString('utf8')),
      recover: hash(settings + originalArtifacts.get('scripts/sql/jfl-ordinary-score-ownership.recovery-body.sql').toString('utf8')),
    },
  };
  const context = { now, approvalSha256: jflSqlApprovalDigest(m), reviewedSourceSha: m.sourceSha, reviewedInventorySha256: m.inventorySha256,
    jflAgreement: m.review.jfl, druAgreement: m.review.dru, exclusionId: m.exclusion.id,
    transportQualification: m.transport.qualification, qualifiedFraming: 'service-owned',
    unusedMigrationNames: [m.history.installName,m.history.recoveryName],
    health: { observedAt: iso(now), url: m.healthUrl,
      body: { ok: true, environment: 'jfl', expectedSupabaseSchema: 'jfl', versionTag: m.expectedDeployedSha,
        checks: ['knownWorkerEnvironment','supabaseUrlUsesExpectedHost',
          'supabaseProjectMatchesEnvironment','supabaseSchemaMatchesEnvironment',
          'expectedProjectRefIsolated','actualProjectIsolated'].map(name => ({ name,ok: true })) } },
  };
  const artifacts = new Map([...originalArtifacts].map(([key, bytes]) => [key,Buffer.from(bytes)]));
  return { m, context, artifacts };
}
const run = f => prepare({ manifestBytes: Buffer.from(JSON.stringify(f.m)), inventoryBytes, artifacts: f.artifacts, context: f.context });
function evidence(plan) {
  return { runId: plan.runId, manifestSha256: plan.manifestSha256, sourceSha: plan.sourceSha,
    project: plan.project, deployedSha: plan.expectedDeployedSha, payloadSha256: plan.candidateSha256,
    submittedAt: iso(now), observedAt: iso(now+1000), submission: 'attempted', phase: 'install',
    writerTerminated: true, independentReadback: true, data: 'unchanged', peerCatalog: 'unchanged',
    catalog: 'exact-candidate', guard: 'exact-candidate', history: 'committed-install',
    recoveryReviewed: true, exclusionValid: true };
}

test('real inventoried SQL prepares exact timeout-prefixed bytes without authorizing a writer', () => {
  const f = fixture(), plan = run(f);
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.manifestSha256, hash(Buffer.from(JSON.stringify(f.m))));
  assert.equal(plan.payloads.install, settings + originalArtifacts.get('scripts/sql/jfl-ordinary-score-ownership.candidate.sql'));
  assert.equal(plan.payloads.recover, settings + originalArtifacts.get('scripts/sql/jfl-ordinary-score-ownership.recovery-body.sql'));
  assert.ok(Object.isFrozen(plan) && Object.isFrozen(plan.payloads));
  f.m.runId = 'changed'; f.artifacts.values().next().value.fill(0);
  assert.equal(classify(plan,evidence(plan)).action, 'use-reviewed-recovery');
});

const bad = {
  'production project': f => { f.m.project = 'cpiucsxlkicmlbvdvhww'; },
  'DRU environment': f => { f.m.environment = 'dru'; },
  'unknown URL': f => { f.m.healthUrl += '?alternate=1'; },
  'peer schema': f => { f.m.schemas.push('dru'); },
  'missing source review': f => { delete f.context.reviewedSourceSha; },
  'wrong experiment purpose': f => { f.m.purpose = 'transport-qualification'; },
  'source moved': f => { f.m.sourceSha = 'c'.repeat(40); },
  'missing DRU agreement': f => { delete f.context.druAgreement; },
  'same reviewer evidence': f => { f.m.review.dru = f.m.review.jfl; },
  'wrong issue agreement': f => { f.m.review.dru = agreement(2).replace('3686','3288'); },
  'future interval': f => { f.m.exclusion.startsAt = iso(now+1); },
  'expired interval': f => { f.m.exclusion.endsAt = iso(now); },
  'unbounded interval': f => { f.m.exclusion.endsAt = iso(now+3600001); },
  'unacknowledged interval': f => { delete f.m.exclusion.dru; },
  'wrong interval': f => { f.context.exclusionId = 'another-interval'; },
  'stale health': f => { f.context.health.observedAt = iso(now-120001); f.m.exclusion.startsAt = iso(now-180000); },
  'future health': f => { f.context.health.observedAt = iso(now+1); },
  'health predates exclusion': f => { f.context.health.observedAt = iso(now-60001); },
  'wrong deployment': f => { f.context.health.body.versionTag = 'c'.repeat(40); },
  'null deployment': f => { f.context.health.body.versionTag = null; },
  'unhealthy check': f => { f.context.health.body.checks[0].ok = false; },
  'unproven health': f => { f.context.health.body.checks = []; },
  'missing isolation proof': f => { f.context.health.body.checks.pop(); },
  'ambiguous isolation proof': f => { f.context.health.body.checks.push(f.context.health.body.checks[0]); },
  'wrong health schema': f => { f.context.health.body.expectedSupabaseSchema = 'public'; },
  'unbounded statement': f => { f.m.timeouts.statementMs = 0; },
  'string timeout': f => { f.m.timeouts.lockMs = '2000'; },
  'deadline before server': f => { f.m.timeouts.clientMs = 20000; },
  'deadline after interval': f => { f.m.exclusion.endsAt = iso(now+60000); },
  'payload-owned framing': f => { f.m.transport.framing = 'payload-owned'; f.context.qualifiedFraming = 'payload-owned'; },
  'unqualified transport': f => { delete f.context.transportQualification; },
  'alternate transport': f => { f.m.transport.kind = 'psql'; },
  'history erasure': f => { f.m.history.treatment = 'delete-records'; },
  'reused migration name': f => { f.context.unusedMigrationNames.pop(); },
  'duplicate migration names': f => { f.m.history.recoveryName = f.m.history.installName; },
  'unreviewed inventory': f => { f.context.reviewedInventorySha256 = '0'.repeat(64); },
  'missing artifact': f => { f.artifacts.delete(f.artifacts.keys().next().value); },
  'unknown artifact': f => { f.artifacts.set('../outside.sql',Buffer.from('select 1')); },
  'same-length payload drift': f => { f.artifacts.values().next().value[0] ^= 1; },
  'changed timeout payload digest': f => { f.m.timeouts.lockMs = 1000; },
  'missing final payload pin': f => { delete f.m.payloadSha256.recover; },
};
for (const [name, mutate] of Object.entries(bad)) {
  test(`preflight refuses ${name}`, () => {
    const f = fixture(); mutate(f);
    // A review cannot make an invalid target, window or payload valid.
    f.context.approvalSha256 = jflSqlApprovalDigest(f.m);
    assert.throws(() => run(f), /^Error: JFL_SQL_PREFLIGHT_[A-Z]+$/);
  });
}
test('invalid UTF8/JSON, oversize manifests and altered inventory produce fixed sanitized errors', () => {
  const f = fixture();
  for (const manifestBytes of [Buffer.from([0xff]),Buffer.from('{'),Buffer.alloc(65537),Buffer.from('null')]) {
    assert.throws(() => prepare({ ...f, manifestBytes, inventoryBytes }), /JFL_SQL_PREFLIGHT_MANIFEST/);
  }
  const changed = Buffer.from(inventoryBytes); changed[0] ^= 1;
  assert.throws(() => prepare({ ...f, manifestBytes: Buffer.from(JSON.stringify(f.m)), inventoryBytes: changed }), /JFL_SQL_PREFLIGHT_INVENTORY/);
});
test('approval core binds all proposal content while review references remain separate', () => {
  const f = fixture(), approved = jflSqlApprovalDigest(f.m);
  const changedReferences = structuredClone(f.m);
  changedReferences.review = { jfl: agreement(11),dru: agreement(12) };
  changedReferences.exclusion.jfl = agreement(11); changedReferences.exclusion.dru = agreement(12);
  assert.equal(jflSqlApprovalDigest(changedReferences),approved);
  assert.throws(() => jflSqlApprovalDigest({ ...f.m,review: { ...f.m.review,unreviewedPayload: 'other' } }),/JFL_SQL_PREFLIGHT_MANIFEST/);
  f.m.history.installName += '_different';
  assert.notEqual(jflSqlApprovalDigest(f.m),approved);
  assert.throws(() => run(f),/JFL_SQL_PREFLIGHT_REVIEW/);
});
test('collected approvals cannot substitute for current exclusion, service qualification or history proof', async () => {
  const f = fixture();
  const reviews = await collectJflSqlReviewContext({ manifestBytes: Buffer.from(JSON.stringify(f.m)),
    expectedSourceSha: f.m.sourceSha,clock: () => now,
    readComment: async id => ({ id: Number(id),
      issue_url: 'https://api.github.com/repos/Fremont-Derby/fremontderby/issues/3686',
      user: { login: 'subiki' },author_association: 'MEMBER',
      created_at: '2026-11-04T19:29:00Z',updated_at: '2026-11-04T19:29:01Z',
      body: '```jfl-sql-review\n'+JSON.stringify({ schemaVersion: 1,lane: id === '1' ? 'JFL' : 'DRU',decision: 'AGREE',
        card: 3686,project: f.m.project,purpose: f.m.purpose,sourceSha: f.m.sourceSha,
        runId: f.m.runId,approvalSha256: jflSqlApprovalDigest(f.m) })+'\n```',
    }),readHealth: async () => f.context.health.body });
  const attempt = context => prepare({ manifestBytes: Buffer.from(JSON.stringify(f.m)),inventoryBytes,artifacts: f.artifacts,context });
  assert.throws(() => attempt(reviews),/JFL_SQL_PREFLIGHT_EXCLUSION/);
  const exclusive = { ...reviews,exclusionId: f.m.exclusion.id };
  assert.throws(() => attempt(exclusive),/JFL_SQL_PREFLIGHT_TRANSPORT/);
  const qualified = { ...exclusive,transportQualification: f.m.transport.qualification,qualifiedFraming: 'service-owned' };
  assert.throws(() => attempt(qualified),/JFL_SQL_PREFLIGHT_HISTORY/);
  assert.equal(attempt({ ...qualified,unusedMigrationNames: f.context.unusedMigrationNames }).executionAuthorized,false);
});

test('bound independent outcomes retain the existing no-replay and exact restoration rules', () => {
  const plan = run(fixture()), e = evidence(plan);
  assert.equal(classify(plan,e).action, 'use-reviewed-recovery');
  assert.equal(classify(plan,{ ...e, writerTerminated: false }).state, 'unknown');
  assert.equal(classify(plan,{ ...e, independentReadback: false }).state, 'unknown');
  const restored = { ...e, phase: 'recover', payloadSha256: plan.recoverySha256,
    catalog: 'baseline', guard: 'absent', history: 'expected-restoration' };
  assert.equal(classify(plan,restored).releaseExclusion, true);
  assert.equal(classify(plan,{ ...restored, data: 'changed' }).releaseExclusion, false);
  assert.equal(classify(plan,{ ...restored, observedAt: iso(plan.exclusionEndsAt+1) }).releaseExclusion, true);
  assert.notEqual(classify(plan,{ ...e, observedAt: iso(plan.exclusionEndsAt) }).action,'use-reviewed-recovery');
});
test('another run, manifest, payload, source or pre-submission read-back is never accepted', () => {
  const plan = run(fixture()), e = evidence(plan);
  for (const key of ['runId','manifestSha256','sourceSha','project','deployedSha','payloadSha256','phase']) {
    assert.equal(classify(plan,{ ...e, [key]: 'another-run' }).state,'unknown',key);
    const missing = { ...e }; delete missing[key];
    assert.equal(classify(plan,missing).state,'unknown',key);
  }
  for (const change of [{ submittedAt: iso(now-1) },{ observedAt: iso(now-1) },
    { submittedAt: iso(plan.exclusionEndsAt) },{ submittedAt: 'invalid' },{ observedAt: null }]) {
    assert.equal(classify(plan,{ ...e,...change }).state,'unknown');
  }
  for (const fake of [null,{}, { ...plan },JSON.parse(JSON.stringify(plan))]) {
    assert.equal(classify(fake,e).state,'unknown');
  }
  assert.equal(classify(plan,{ ...e, response: '201', writerTerminated: false }).retryMutation,false);
});
