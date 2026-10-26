import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { retryAfterMilliseconds, waitForObserved429, observeAvailabilityThrottle } from '../browser/jfl/fixture-throttle.js';

const now = Date.UTC(2026, 9, 26, 8);
const fake = () => {
  const page = new EventEmitter();
  page.waits = [];
  page.waitForTimeout = async ms => { page.waits.push(ms); };
  page.respond = (path, header, status = 429, method = 'GET') => page.emit('response', {
    url: () => 'https://jfl.fremontderby.com' + path, status: () => status,
    request: () => ({ method: () => method }), headers: () => ({ 'retry-after': header }),
  });
  return page;
};

test('fixture retry accepts bounded numeric and absolute date waits', () => {
  assert.equal(retryAfterMilliseconds(' 10 ', now), 10_000);
  assert.equal(retryAfterMilliseconds('60', now), 60_000);
  assert.equal(retryAfterMilliseconds(new Date(now + 12_000).toUTCString(), now), 12_000);
});

test('fixture retry rejects absent, zero, invalid, negative, expired and excessive waits', () => {
  for (const header of [null, '', '0', '-1', '1e1', '2.5', 'invalid', '61', '1000000', new Date(now).toUTCString(), new Date(now + 61_000).toUTCString(), new Date(now + 12_000).toISOString()]) {
    assert.throws(() => retryAfterMilliseconds(header, now), /validated positive Retry-After/);
  }
});

test('direct recovery never sleeps for non429 or an unqualified header', async () => {
  const page = fake();
  await assert.rejects(waitForObserved429(page, { status: 503, retryAfter: '10' }, now), /observed HTTP429/);
  await assert.rejects(waitForObserved429(page, { status: 429, retryAfter: null }, now), /validated positive/);
  assert.deepEqual(page.waits, []);
  await waitForObserved429(page, { status: 429, retryAfter: '10' }, now);
  assert.deepEqual(page.waits, [11_000]);
});

test('availability recovery ignores unrelated endpoints, methods and statuses', async () => {
  const page = fake(), tracker = observeAvailabilityThrottle(page, 'qa', () => now);
  page.respond('/api/me/notifications', '10');
  page.respond('/api/seasons/other/availability/me', '10');
  page.respond('/api/seasons/qa/availability/me', '10', 200);
  page.respond('/api/seasons/qa/availability/me', '10', 429, 'PUT');
  await assert.rejects(tracker.wait(), /observed matching HTTP429/);
  assert.deepEqual(page.waits, []);
  tracker.dispose();
  assert.equal(page.listenerCount('response'), 0);
});

test('availability recovery honors the longest observed wait and elapsed time once', async () => {
  const page = fake();
  let time = now;
  const tracker = observeAvailabilityThrottle(page, 'qa', () => time);
  page.respond('/api/me/teams', '20');
  page.respond('/api/seasons/qa/availability/me?date=2026-11-02', '10');
  time += 3000;
  await tracker.wait();
  assert.deepEqual(page.waits, [18_000]);
  await assert.rejects(tracker.wait(), /observed matching HTTP429/);
  tracker.dispose();
});

test('one invalid matching429 prevents qualification by another valid response', async () => {
  const page = fake(), tracker = observeAvailabilityThrottle(page, 'qa', () => now);
  page.respond('/api/me/team-match-choices', null);
  page.respond('/api/seasons/qa/availability/me', '10');
  await assert.rejects(tracker.wait(), /validated positive/);
  assert.deepEqual(page.waits, []);
  tracker.dispose();
});

test('disposed availability observer cannot authorize another retry', async () => {
  const page = fake(), tracker = observeAvailabilityThrottle(page, 'qa', () => now);
  page.respond('/api/me/teams', '10');
  tracker.dispose();
  page.respond('/api/me/teams', '10');
  await assert.rejects(tracker.wait(), /observed matching HTTP429/);
  assert.equal(page.listenerCount('response'), 0);
  assert.deepEqual(page.waits, []);
});

test('availability recovery also honors a matching429 observed during its wait', async () => {
  const page = fake();
  let time = now;
  const tracker = observeAvailabilityThrottle(page, 'qa', () => time);
  page.waitForTimeout = async ms => {
    page.waits.push(ms); time += ms;
    if (page.waits.length === 1) page.respond('/api/me/teams', '20');
  };
  page.respond('/api/me/teams', '10');
  await tracker.wait();
  assert.deepEqual(page.waits, [11_000, 21_000]);
  tracker.dispose();
});

test('continuing429 during cooldown stops after bounded waits without another request', async () => {
  const page = fake();
  let time = now;
  const tracker = observeAvailabilityThrottle(page, 'qa', () => time);
  page.waitForTimeout = async ms => { page.waits.push(ms); time += ms; page.respond('/api/me/teams', '1'); };
  page.respond('/api/me/teams', '1');
  await assert.rejects(tracker.wait(), /remained throttled/);
  assert.deepEqual(page.waits, [2000, 2000, 2000]);
  tracker.dispose();
});
