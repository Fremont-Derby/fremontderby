// Source-only decision gate for #3686. Callers must independently obtain evidence;
// a transport response cannot establish catalog, history, data or writer state.
export function classifyJflSqlOutcome(evidence) {
  const result = (state, action, releaseExclusion = false) => Object.freeze({
    state, action, releaseExclusion, retryMutation: false,
  });
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    return result('unknown', 'retain-exclusion');
  }
  if (evidence.submission === 'not-attempted') {
    return result('not-submitted', 'fix-preflight');
  }
  if (evidence.submission !== 'attempted' || evidence.writerTerminated !== true
      || evidence.independentReadback !== true) {
    return result('unknown', 'retain-exclusion');
  }
  // Every comparison is exact and positive. Missing evidence is never equality.
  if (evidence.data !== 'unchanged' || evidence.peerCatalog !== 'unchanged') {
    return result('divergent', 'stop-and-investigate');
  }
  if (evidence.phase === 'install' && evidence.catalog === 'baseline'
      && evidence.guard === 'absent' && evidence.history === 'proven-rollback') {
    return result('rolled-back', 'requalify-before-new-attempt', true);
  }
  if (evidence.phase === 'install' && evidence.catalog === 'exact-candidate'
      && evidence.guard === 'exact-candidate' && evidence.history === 'committed-install'
      && evidence.recoveryReviewed === true && evidence.exclusionValid === true) {
    return result('installed', 'use-reviewed-recovery');
  }
  if (evidence.phase === 'recover' && evidence.catalog === 'baseline'
      && evidence.guard === 'absent' && evidence.history === 'expected-restoration') {
    return result('restored', 'record-restoration', true);
  }
  return result('divergent', 'stop-and-investigate');
}
