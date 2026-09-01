import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resetTelemetry,
  snapshotTelemetry,
  trackEvent,
} from '../src/privacySafeTelemetry.js';

test('trackEvent increments counters and snapshots counts', () => {
  resetTelemetry();
  trackEvent('workflow.ok', { route: '/api/me' });
  trackEvent('workflow.ok', { route: '/api/me' });
  trackEvent('workflow.fail', { status: 500 });
  const snap = snapshotTelemetry();
  assert.equal(snap['workflow.ok'].count, 2);
  assert.equal(snap['workflow.fail'].count, 1);
  assert.equal(snap['workflow.ok'].last.dims.route, '/api/me');
});

test('trackEvent strips sensitive dimension keys', () => {
  resetTelemetry();
  trackEvent('auth.attempt', {
    phone: '+15551212',
    token: 'secret-token',
    password: 'x',
    email: 'a@b.c',
    message: 'hello',
    body: 'payload',
    authorization: 'Bearer abc',
    ok: true,
    lane: 'dru',
  });
  const last = snapshotTelemetry()['auth.attempt'].last.dims;
  assert.equal(last.ok, true);
  assert.equal(last.lane, 'dru');
  assert.equal('phone' in last, false);
  assert.equal('token' in last, false);
  assert.equal('password' in last, false);
  assert.equal('email' in last, false);
  assert.equal('message' in last, false);
  assert.equal('body' in last, false);
  assert.equal('authorization' in last, false);
});

test('trackEvent drops overlong string dimensions', () => {
  resetTelemetry();
  const long = 'x'.repeat(65);
  trackEvent('trim', { short: 'ok', long });
  const dims = snapshotTelemetry().trim.last.dims;
  assert.equal(dims.short, 'ok');
  assert.equal('long' in dims, false);
});

test('resetTelemetry clears all buckets', () => {
  resetTelemetry();
  trackEvent('once');
  assert.equal(snapshotTelemetry().once.count, 1);
  resetTelemetry();
  assert.deepEqual(snapshotTelemetry(), {});
});
