import test from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent, snapshotTelemetry, resetTelemetry } from '../src/privacySafeTelemetry.js';
import { actionCard } from '../src/actionCard.js';
import { summarizeEngagement } from '../src/engagementCounters.js';

test('telemetry strips sensitive dims', () => {
  resetTelemetry();
  trackEvent('score.finalize', { lane: 'jfl', phone: '555', token: 'x' });
  const snap = snapshotTelemetry();
  assert.equal(snap['score.finalize'].count, 1);
  assert.equal(snap['score.finalize'].last.dims.lane, 'jfl');
  assert.equal(snap['score.finalize'].last.dims.phone, undefined);
});

test('action card shape', () => {
  const c = actionCard({ title: 'Try Score', body: 'Open hub', href: '/scorecard' });
  assert.equal(c.href, '/scorecard');
});

test('engagement is aggregates only', () => {
  const s = summarizeEngagement({ threads: 2, messages: 10 });
  assert.equal(s.messages, 10);
  assert.equal(Object.keys(s).includes('bodies'), false);
});
