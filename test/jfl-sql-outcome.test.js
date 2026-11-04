import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyJflSqlOutcome as classify } from '../scripts/lib/jfl-sql-outcome.mjs';

const installed = {
  submission: 'attempted', writerTerminated: true, independentReadback: true,
  phase: 'install', catalog: 'exact-candidate', guard: 'exact-candidate',
  history: 'committed-install', data: 'unchanged', peerCatalog: 'unchanged',
  recoveryReviewed: true, exclusionValid: true,
};
const rolledBack = { ...installed, catalog: 'baseline', guard: 'absent', history: 'proven-rollback' };
const restored = { ...rolledBack, phase: 'recover', history: 'expected-restoration' };

test('exact committed installation permits reviewed recovery, never replay or exclusion release', () => {
  assert.deepEqual(classify(installed), {
    state: 'installed', action: 'use-reviewed-recovery', releaseExclusion: false, retryMutation: false,
  });
});
test('only independently proven rollback or restoration releases exclusion', () => {
  assert.equal(classify(rolledBack).state, 'rolled-back');
  assert.equal(classify(restored).state, 'restored');
  assert.equal(classify(rolledBack).releaseExclusion, true);
  assert.equal(classify(restored).releaseExclusion, true);
  assert.equal(classify({ ...restored, history: 'proven-rollback' }).releaseExclusion, false);
});
for (const [name, baseline] of Object.entries({ installed, rolledBack, restored })) {
  for (const key of Object.keys(baseline)) {
    if (name !== 'installed' && ['recoveryReviewed', 'exclusionValid'].includes(key)) continue;
    test(`${name}: missing ${key} cannot authorize mutation or release`, () => {
      const incomplete = { ...baseline };
      delete incomplete[key];
      const decision = classify(incomplete);
      assert.equal(decision.releaseExclusion, false);
      assert.notEqual(decision.action, 'use-reviewed-recovery');
      assert.equal(decision.retryMutation, false);
    });
  }
}
test('HTTP and client results cannot substitute for independent evidence', () => {
  for (const response of ['success', '429', 'timeout', 'response-lost', 'error']) {
    assert.equal(classify({ submission: 'attempted', response }).state, 'unknown');
    assert.equal(classify({ ...installed, response, writerTerminated: false }).state, 'unknown');
    assert.equal(classify({ ...restored, response, independentReadback: false }).releaseExclusion, false);
  }
});
test('changed data, peer catalog, guard or history stops recovery without retry', () => {
  for (const field of ['data', 'peerCatalog', 'guard', 'catalog', 'history']) {
    const decision = classify({ ...installed, [field]: 'changed' });
    assert.equal(decision.action, 'stop-and-investigate');
    assert.equal(decision.releaseExclusion, false);
    assert.equal(decision.retryMutation, false);
  }
});
test('invalid inputs and truthy strings refuse evidence', () => {
  for (const input of [null, undefined, [], 'success', { ...installed, writerTerminated: 'true' }]) {
    assert.equal(classify(input).state, 'unknown');
  }
  assert.equal(classify({ submission: 'not-attempted' }).action, 'fix-preflight');
});
