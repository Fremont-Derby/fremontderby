import test from 'node:test';
import assert from 'node:assert/strict';
import { planFargoReports, fargoReportSummary } from '../src/fargoReportStore.js';

test('the same score does not store another revision', () => {
  const match = { playerMatchId: 'm', playerAId: 'a', playerBId: 'b', playerAFargoId: '1', playerBFargoId: '2', racks: [{ winnerId: 'a' }] };
  const first = planFargoReports(match, []);
  const again = planFargoReports(match, [{ revision: 1, status: 'not_sent', payload: first.record, idempotency_key: first.record.idempotencyKey }]);
  assert.equal(again.insert, null);
});

test('a changed score supersedes the stored revision', () => {
  const stored = [{ revision: 1, status: 'not_sent', idempotency_key: 'm:r1', payload: { score: [1, 0], idempotencyKey: 'm:r1', revision: 1 } }];
  const next = planFargoReports({ playerMatchId: 'm', playerAId: 'a', playerBId: 'b', playerAFargoId: '1', playerBFargoId: '2', racks: [{ winnerId: 'b' }] }, stored);
  assert.equal(next.record.revision, 2);
  assert.equal(next.supersede, 'm:r1');
});

test('admin summary splits unreported, missing links, and corrections', () => {
  const summary = fargoReportSummary([
    { status: 'not_sent' },
    { status: 'needs_review' },
    { status: 'superseded' },
  ]);
  assert.equal(summary.unreported.length, 1);
  assert.equal(summary.missingLinks.length, 1);
  assert.equal(summary.corrections.length, 1);
});
