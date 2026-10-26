import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { observeAdminReads } from '../browser/jfl/admin-read-recovery.js';

const now = Date.UTC(2026, 9, 26, 12);
function fixture() {
  const page = new EventEmitter();
  let time = now;
  page.url = () => 'https://jfl.fremontderby.com/season-setup';
  page.waits = [];
  page.waitForTimeout = async ms => { page.waits.push(ms); time += ms; };
  page.respond = (path, header, status = 429, method = 'GET', origin = 'https://jfl.fremontderby.com') => page.emit('response', {
    url: () => origin + path, status: () => status,
    headers: () => ({ 'retry-after': header }), request: () => ({ method: () => method }),
  });
  const reads = observeAdminReads(page, () => 'qa', () => time);
  return { page, reads, advance: ms => { time += ms; } };
}

test('Admin recovery honors advisory/core longest deadline and elapsed time', async () => {
  const { page, reads, advance } = fixture();
  page.respond('/api/admin/seasons/qa/team-candidates', '20');
  page.respond('/api/admin/seasons/qa/setup', '10');
  advance(3000);
  await reads.wait();
  assert.deepEqual(page.waits, [18_000]);
  assert.equal(reads.hasPending(), false);
  reads.dispose();
});

test('Admin recovery excludes other origins, seasons, methods and advisory denials', async () => {
  const { page, reads } = fixture();
  page.respond('/api/admin/seasons/qa/setup', '10', 429, 'GET', 'https://other.test');
  page.respond('/api/admin/seasons/other/setup', '10');
  page.respond('/api/admin/seasons/qa/setup', '10', 429, 'PUT');
  page.respond('/api/admin/seasons/qa/team-candidates', null, 403);
  page.respond('/api/me/notifications', '10');
  await assert.rejects(reads.wait(), /observed matching/);
  assert.deepEqual(page.waits, []);
  reads.dispose();
  assert.equal(page.listenerCount('response'), 0);
});

test('invalid advisory header poisons recovery even with a valid core throttle', async () => {
  const { page, reads } = fixture();
  page.respond('/api/admin/seasons/qa/close-readiness', null);
  page.respond('/api/admin/seasons', '10');
  await assert.rejects(reads.wait(), /validated positive/);
  await assert.rejects(reads.wait(), /validated positive/);
  assert.deepEqual(page.waits, []);
  reads.dispose();
});

test('core denial stops before an otherwise qualified cooldown', async () => {
  const { page, reads } = fixture();
  page.respond('/api/admin/seasons/qa/setup', null, 401);
  page.respond('/api/admin/seasons/qa/team-registration', '10');
  assert.throws(reads.assertNoFailure, /HTTP401/);
  await assert.rejects(reads.wait(), /HTTP401/);
  assert.deepEqual(page.waits, []);
  reads.dispose();
});

test('late advisory429 extends cooldown, then observer is removed', async () => {
  const { page, reads } = fixture();
  const wait = page.waitForTimeout;
  page.waitForTimeout = async ms => {
    await wait(ms);
    if (page.waits.length === 1) page.respond('/api/admin/seasons/qa/close-readiness', '20');
  };
  page.respond('/api/admin/seasons', '1');
  await reads.wait();
  assert.deepEqual(page.waits, [2000, 21_000]);
  reads.dispose();
  assert.equal(page.listenerCount('response'), 0);
  page.respond('/api/admin/seasons', '10');
  await assert.rejects(reads.wait(), /observed matching/);
});

test('continuing Admin throttles stop after three waves', async () => {
  const { page, reads } = fixture();
  const wait = page.waitForTimeout;
  page.waitForTimeout = async ms => { await wait(ms); page.respond('/api/admin/seasons', '1'); };
  page.respond('/api/admin/seasons', '1');
  await assert.rejects(reads.wait(), /remained throttled/);
  assert.deepEqual(page.waits, [2000, 2000, 2000]);
  reads.dispose();
});
