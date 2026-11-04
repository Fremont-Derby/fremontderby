// Read-only preparation for #3686. This validates supplied review/evidence;
// it does not authenticate reviewers, qualify a service, or authorize a writer.
import { createHash } from 'node:crypto';
import { classifyJflSqlOutcome } from './jfl-sql-outcome.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const project = 'oqkkvqkerusepyokzbmt';
const healthUrl = 'https://jfl.fremontderby.com/health/environment';
const isolationChecks = ['knownWorkerEnvironment','supabaseUrlUsesExpectedHost',
  'supabaseProjectMatchesEnvironment','supabaseSchemaMatchesEnvironment',
  'expectedProjectRefIsolated','actualProjectIsolated'];
const prefix = 'scripts/sql/jfl-ordinary-score-ownership.';
const files = Object.freeze([
  `${prefix}candidate.sql`, `${prefix}recovery.sql`, `${prefix}recovery-body.sql`,
  'test/fixtures/jfl-ordinary-score-baseline.json',
  'test/fixtures/jfl-score-takeover-resolver.sql',
  'test/fixtures/jfl-score-claim-eligibility.sql',
  'test/fixtures/jfl-score-claim-transitions.sql',
]);
const plans = new WeakSet();
function requireThat(condition, code) {
  // Fixed error codes only: no raw manifest, SQL, identity or provider errors.
  if (!condition) throw new Error(`JFL_SQL_PREFLIGHT_${code}`);
}
function timestamp(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
    ? Date.parse(value) : NaN;
}
function decode(bytes, code) {
  requireThat(Buffer.isBuffer(bytes) && bytes.length > 0 && bytes.length <= 65536, code);
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Error(`JFL_SQL_PREFLIGHT_${code}`); }
}
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const agreement = value => typeof value === 'string'
  && /^https:\/\/github\.com\/Fremont-Derby\/fremontderby\/issues\/3686#issuecomment-\d+$/.test(value);

export function isQualifiedJflSqlHealth(body, expectedSha) {
  return sha(expectedSha) && object(body) && body.ok === true && body.environment === 'jfl'
    && body.expectedSupabaseSchema === 'jfl' && body.versionTag === expectedSha
    && Array.isArray(body.checks) && body.checks.length > 0
    && body.checks.every(check => check?.ok === true)
    && isolationChecks.every(name => body.checks.filter(check => check.name === name).length === 1);
}

// Attest the complete execution proposal, excluding only approval references.
// Keeping those references outside the signed core avoids circular approvals.
export function jflSqlApprovalDigest(manifest) {
  requireThat(object(manifest), 'MANIFEST');
  if (Object.hasOwn(manifest,'review')) {
    requireThat(object(manifest.review) && Object.keys(manifest.review).every(key => ['jfl','dru'].includes(key)), 'MANIFEST');
  }
  const core = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== 'review'));
  if (object(core.exclusion)) {
    core.exclusion = Object.fromEntries(Object.entries(core.exclusion).filter(([key]) => !['jfl','dru'].includes(key)));
  }
  const canonical = (value,depth = 0) => {
    requireThat(depth <= 32, 'MANIFEST');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') { requireThat(Number.isFinite(value), 'MANIFEST'); return value; }
    if (Array.isArray(value)) return value.map(item => canonical(item,depth+1));
    requireThat(object(value), 'MANIFEST');
    return Object.fromEntries(Object.keys(value).sort().map(key => [key,canonical(value[key],depth+1)]));
  };
  return sha256(Buffer.from(JSON.stringify(canonical(core)),'utf8'));
}

function checkTimeouts(t) {
  requireThat(object(t) && ['lockMs','statementMs','idleMs','clientMs'].every(key => Number.isSafeInteger(t[key]) && t[key] > 0)
    && t.lockMs <= 5000 && t.lockMs < t.statementMs && t.statementMs <= 60000
    && t.statementMs <= t.idleMs && t.idleMs < t.clientMs && t.clientMs <= 120000, 'TIMEOUTS');
}

// Deterministic review artifact generation only. The caller/service must own
// one qualified transaction; this never adds or strips transaction framing.
export function compileJflSqlPayloads({ candidateBytes, recoveryBodyBytes, timeouts }) {
  checkTimeouts(timeouts);
  const settings = `SET LOCAL lock_timeout = '${timeouts.lockMs}ms';\nSET LOCAL statement_timeout = '${timeouts.statementMs}ms';\nSET LOCAL idle_in_transaction_session_timeout = '${timeouts.idleMs}ms';\n`;
  const payloads = {};
  for (const [phase, bytes] of [['install',candidateBytes],['recover',recoveryBodyBytes]]) {
    requireThat(Buffer.isBuffer(bytes) && bytes.length > 0, 'ARTIFACTS');
    try { payloads[phase] = settings + new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw new Error('JFL_SQL_PREFLIGHT_ARTIFACTS'); }
  }
  return Object.freeze(payloads);
}

export function prepareJflSqlExperiment({ manifestBytes, inventoryBytes, artifacts, context }) {
  requireThat(object(context) && Number.isFinite(context.now), 'CONTEXT');
  const m = decode(manifestBytes, 'MANIFEST');
  requireThat(object(m) && m.schemaVersion === 1 && m.card === 3686 && m.purpose === 'candidate-recovery', 'MANIFEST');
  requireThat(typeof m.runId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(m.runId), 'RUN');
  requireThat(m.ownerLane === 'jfl' && typeof m.owner === 'string' && /^[a-z0-9-]{8,80}$/.test(m.owner), 'OWNER');
  requireThat(m.project === project && m.environment === 'jfl' && m.healthUrl === healthUrl
    && Array.isArray(m.schemas) && m.schemas.join(',') === 'jfl,jfl_private', 'TARGET');
  requireThat(sha(m.sourceSha) && m.sourceSha === context.reviewedSourceSha
    && sha(m.expectedDeployedSha), 'SOURCE');
  requireThat(object(m.review) && agreement(m.review.jfl) && agreement(m.review.dru)
    && m.review.jfl !== m.review.dru && m.review.jfl === context.jflAgreement
    && m.review.dru === context.druAgreement && digest(context.approvalSha256)
    && context.approvalSha256 === jflSqlApprovalDigest(m), 'REVIEW');
  const start = timestamp(m.exclusion?.startsAt), end = timestamp(m.exclusion?.endsAt);
  requireThat(Number.isFinite(start) && Number.isFinite(end) && start <= context.now
    && end > context.now && end - start <= 3600000 && m.exclusion.id === context.exclusionId
    && typeof m.exclusion.id === 'string' && /^[a-z0-9-]{8,80}$/.test(m.exclusion.id)
    && m.exclusion.jfl === m.review.jfl && m.exclusion.dru === m.review.dru, 'EXCLUSION');
  const health = context.health;
  const observedAt = timestamp(health?.observedAt);
  requireThat(object(health) && Number.isFinite(observedAt) && observedAt >= start
    && observedAt <= context.now && context.now - observedAt <= 120000
    && health.url === healthUrl && isQualifiedJflSqlHealth(health.body,m.expectedDeployedSha), 'HEALTH');
  const t = m.timeouts;
  checkTimeouts(t);
  requireThat(context.now + t.clientMs < end, 'TIMEOUTS');
  const transport = m.transport;
  requireThat(object(transport) && transport.kind === 'supabase-mcp-apply-migration'
    // Candidate has no explicit-transaction variant. Do not improvise framing.
    && transport.framing === 'service-owned'
    && agreement(transport.qualification) && transport.qualification === context.transportQualification
    && transport.framing === context.qualifiedFraming, 'TRANSPORT');
  const history = m.history;
  requireThat(object(history) && history.treatment === 'retain-records'
    && ['installName','recoveryName'].every(key => typeof history[key] === 'string'
      && /^jfl_3686_[a-z0-9_]{8,80}$/.test(history[key]))
    && history.installName !== history.recoveryName
    && Array.isArray(context.unusedMigrationNames)
    && [history.installName,history.recoveryName].every(name => context.unusedMigrationNames.includes(name)), 'HISTORY');
  requireThat(digest(m.inventorySha256) && m.inventorySha256 === context.reviewedInventorySha256
    && Buffer.isBuffer(inventoryBytes) && sha256(inventoryBytes) === m.inventorySha256, 'INVENTORY');
  const inventory = decode(inventoryBytes, 'INVENTORY');
  requireThat(inventory?.schemaVersion === 1 && inventory.executionAuthorized === false
    && object(inventory.artifacts) && Object.keys(inventory.artifacts).length === files.length
    && artifacts instanceof Map && artifacts.size === files.length, 'ARTIFACTS');
  for (const file of files) {
    const expected = inventory.artifacts[file], bytes = artifacts.get(file);
    requireThat(object(expected) && digest(expected.sha256) && Buffer.isBuffer(bytes)
      && bytes.length === expected.bytes && sha256(bytes) === expected.sha256, 'ARTIFACTS');
  }
  const recoveryFile = `${prefix}recovery-body.sql`;
  const payloads = compileJflSqlPayloads({ candidateBytes: artifacts.get(`${prefix}candidate.sql`),
    recoveryBodyBytes: artifacts.get(recoveryFile), timeouts: t });
  for (const phase of ['install','recover']) {
    requireThat(digest(m.payloadSha256?.[phase])
      && sha256(Buffer.from(payloads[phase], 'utf8')) === m.payloadSha256[phase], 'PAYLOAD');
  }
  const plan = Object.freeze({
    executionAuthorized: false, runId: m.runId, project, sourceSha: m.sourceSha,
    expectedDeployedSha: m.expectedDeployedSha, manifestSha256: sha256(manifestBytes),
    candidateSha256: m.payloadSha256.install, recoverySha256: m.payloadSha256.recover,
    payloads,
    recoveryFile, exclusionEndsAt: end, preparedAt: context.now,
  });
  plans.add(plan);
  return plan;
}

// Bind independently collected outcome evidence to this prepared run. This
// cannot turn an HTTP result, another run's read-back, or stale pins into proof.
export function classifyJflSqlRunOutcome(plan, evidence) {
  const unknown = () => classifyJflSqlOutcome({ submission: 'attempted' });
  if (!plans.has(plan) || !object(evidence)) return unknown();
  const submitted = timestamp(evidence.submittedAt), observed = timestamp(evidence.observedAt);
  if (!['install','recover'].includes(evidence.phase)
      || evidence.runId !== plan.runId || evidence.manifestSha256 !== plan.manifestSha256
      || evidence.sourceSha !== plan.sourceSha || evidence.project !== plan.project
      || evidence.deployedSha !== plan.expectedDeployedSha
      || evidence.payloadSha256 !== (evidence.phase === 'install' ? plan.candidateSha256 : plan.recoverySha256)
      || !Number.isFinite(submitted) || !Number.isFinite(observed)
      || submitted < plan.preparedAt || submitted >= plan.exclusionEndsAt || observed < submitted) return unknown();
  // Read-back after exclusion expiry can prove restoration, but must not grant
  // a new recovery mutation under an expired interval.
  return classifyJflSqlOutcome({ ...evidence,
    exclusionValid: evidence.exclusionValid === true && observed < plan.exclusionEndsAt,
  });
}
