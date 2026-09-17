import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRU_PUBLIC_SURFACE,
  expectedPublicStatus,
  formatCanaryFailure,
} from '../src/druPublicSurfaceContract.js';

test('DRU public HTML shells that humans use are expected 200', () => {
  for (const path of DRU_PUBLIC_SURFACE.html200) {
    assert.equal(expectedPublicStatus(path), 200, path);
  }
  assert.equal(expectedPublicStatus('/health'), 200);
});

test('retired player-trade surface is expected 404 on DRU', () => {
  assert.equal(expectedPublicStatus('/trades'), 404);
  assert.ok(!DRU_PUBLIC_SURFACE.html200.includes('/trades'));
});

test('canary failure copy names host, kind, status, url, and error', () => {
  const text = formatCanaryFailure({
    host: 'dru.fremontderby.com',
    kind: 'html',
    status: 404,
    url: 'https://dru.fremontderby.com/playoffs',
    error: 'hound',
  });
  assert.match(text, /host=dru\.fremontderby\.com/);
  assert.match(text, /kind=html/);
  assert.match(text, /status=404/);
  assert.match(text, /url=https:\/\/dru\.fremontderby\.com\/playoffs/);
  assert.match(text, /error=hound/);
  assert.doesNotMatch(text, /Still failing: run/);
});
