// Read-only review/health evidence collection. Passing this collector is not
// service qualification, fixture ownership, history proof or writer authority.
import { createHash } from 'node:crypto';
import { jflSqlApprovalDigest, isQualifiedJflSqlHealth } from './jfl-sql-manifest.mjs';
import { buildJflSqlTransportProbes } from './jfl-sql-transport-probes.mjs';

const healthUrl = 'https://jfl.fremontderby.com/health/environment';
const project = 'oqkkvqkerusepyokzbmt';
const issueUrl = 'https://api.github.com/repos/Fremont-Derby/fremontderby/issues/3686';
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const hash = value => createHash('sha256').update(value).digest('hex');
function requireThat(condition, code) {
  if (!condition) throw new Error(`JFL_SQL_REVIEWS_${code}`);
}
function commentId(url) {
  return typeof url === 'string' && /^https:\/\/github\.com\/Fremont-Derby\/fremontderby\/issues\/3686#issuecomment-([0-9]{1,20})$/.exec(url)?.[1];
}
function githubTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === (value.includes('.') ? value : value.replace('Z','.000Z')) ? ms : NaN;
}

export async function collectJflSqlReviewContext({ manifestBytes, expectedSourceSha, clock = Date.now, readComment, readHealth }) {
  requireThat(typeof clock === 'function', 'TIME');
  const startedAt = clock();
  requireThat(Buffer.isBuffer(manifestBytes) && manifestBytes.length > 0 && manifestBytes.length <= 65536, 'MANIFEST');
  let m;
  try { m = JSON.parse(new TextDecoder('utf-8',{ fatal: true }).decode(manifestBytes)); }
  catch { throw new Error('JFL_SQL_REVIEWS_MANIFEST'); }
  requireThat(m && typeof m === 'object' && !Array.isArray(m) && m.schemaVersion === 1 && m.card === 3686
    && ['candidate-recovery','transport-qualification'].includes(m.purpose), 'MANIFEST');
  requireThat(m.project === project && m.environment === 'jfl' && m.healthUrl === healthUrl, 'TARGET');
  requireThat(sha(expectedSourceSha) && m.sourceSha === expectedSourceSha && sha(m.expectedDeployedSha)
    && Number.isSafeInteger(startedAt), 'SOURCE');
  const ids = [commentId(m.review?.jfl),commentId(m.review?.dru)];
  requireThat(ids.every(Boolean) && ids[0] !== ids[1], 'MISSING_ATTESTATIONS');
  let approvalSha256;
  try { approvalSha256 = jflSqlApprovalDigest(m); }
  catch { throw new Error('JFL_SQL_REVIEWS_MANIFEST'); }
  if (m.purpose === 'candidate-recovery') requireThat(digest(m.inventorySha256), 'MANIFEST');
  else {
    let probe;
    try { probe = buildJflSqlTransportProbes({ runId: m.runId }); }
    catch { throw new Error('JFL_SQL_REVIEWS_MANIFEST'); }
    requireThat(digest(m.probePlanSha256) && m.probePlanSha256 === hash(JSON.stringify(probe)), 'PROBE_PLAN');
  }
  requireThat(typeof readComment === 'function' && typeof readHealth === 'function', 'PROVIDERS');
  let comments;
  try { comments = await Promise.all(ids.map(id => readComment(id))); }
  catch { throw new Error('JFL_SQL_REVIEWS_LOOKUP_FAILED'); }
  const lanes = ['JFL','DRU'];
  const witnesses = comments.map((comment,index) => {
    requireThat(comment && String(comment.id) === ids[index] && comment.issue_url === issueUrl
      && comment.user?.login === 'subiki' && ['OWNER','MEMBER','COLLABORATOR'].includes(comment.author_association), 'AUTHOR');
    const created = githubTime(comment.created_at), updated = githubTime(comment.updated_at);
    requireThat(Number.isFinite(created) && Number.isFinite(updated) && created <= updated && updated <= startedAt, 'TIME');
    requireThat(typeof comment.body === 'string' && comment.body.length <= 32768, 'ATTESTATION');
    const blocks = [...comment.body.matchAll(/```jfl-sql-review\r?\n([\s\S]*?)\r?\n```/g)];
    requireThat(blocks.length === 1, 'ATTESTATION');
    let review;
    try { review = JSON.parse(blocks[0][1]); }
    catch { throw new Error('JFL_SQL_REVIEWS_ATTESTATION'); }
    requireThat(review?.schemaVersion === 1 && review.lane === lanes[index] && review.decision === 'AGREE'
      && review.card === 3686 && review.project === project && review.purpose === m.purpose
      && review.sourceSha === expectedSourceSha && review.runId === m.runId
      && review.approvalSha256 === approvalSha256, 'ATTESTATION');
    return Object.freeze({ lane: lanes[index], commentId: ids[index], updatedAt: comment.updated_at,
      bodySha256: hash(Buffer.from(comment.body,'utf8')) });
  });
  let health;
  try { health = await readHealth(healthUrl); }
  catch { throw new Error('JFL_SQL_REVIEWS_HEALTH_FAILED'); }
  requireThat(isQualifiedJflSqlHealth(health,m.expectedDeployedSha), 'HEALTH');
  const now = clock();
  requireThat(Number.isSafeInteger(now) && now >= startedAt, 'TIME');
  const body = Object.freeze({ ok: health.ok, environment: health.environment,
    expectedSupabaseSchema: health.expectedSupabaseSchema, versionTag: health.versionTag,
    checks: Object.freeze(health.checks.map(check => Object.freeze({ name: check.name,ok: check.ok }))) });
  // Only reviewed/observed facts are returned. No exclusion witness, unused
  // history names or transport-qualification flag is inferred from approvals.
  return Object.freeze({ now, approvalSha256, reviewedSourceSha: expectedSourceSha,
    ...(m.purpose === 'candidate-recovery' ? { reviewedInventorySha256: m.inventorySha256 } : {}),
    jflAgreement: m.review.jfl, druAgreement: m.review.dru,
    witnesses: Object.freeze(witnesses),
    health: Object.freeze({ url: healthUrl, observedAt: new Date(now).toISOString(),body }), executionAuthorized: false,
  });
}
