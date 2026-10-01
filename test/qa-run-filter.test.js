import test from 'node:test';
import assert from 'node:assert/strict';
import { filterQaRuns } from '../src/qaRunFilter.js';

test('a run list keeps only complete runs for the chosen lane', () => {
  const runs = [
    { id: 'r1', lane: 'dru', result: 'fail' },
    { id: '', lane: 'dru', result: 'pass' },
    { id: 'r2', lane: 'gamma', result: 'pass' },
  ];
  assert.deepEqual(filterQaRuns(runs, 'dru').map(run => run.id), ['r1']);
});
