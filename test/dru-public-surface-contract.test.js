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
});

test('DRU readiness JSON is expected 200', () => {
  for (const path of DRU_PUBLIC_SURFACE.json200) {
    assert.equal(expectedPublicStatus(path), 200, path);
  }
  assert.ok(DRU_PUBLIC_SURFACE.json200.includes('/health/environment'));
});

test('retired player-trade surface is expected 404 on DRU', () => {
  assert.equal(expectedPublicStatus('/trades'), 404);
  assert.ok(!DRU_PUBLIC_SURFACE.html200.includes('/trades'));
});

test('unlisted paths stay unclassified so canary can ignore them', () => {
  assert.equal(expectedPublicStatus('/seasons'), null);
  assert.equal(expectedPublicStatus('/demo'), null);
  assert.equal(expectedPublicStatus('/health/ready'), null);
});

test('canary failure copy names host, kind, status, url, and error', () => {
  const text = formatCanaryFailure({
    host: 'dru.fremontderby.com',
    kind: 'json',
    status: 503,
    url: 'https://dru.fremontderby.com/health/environment',
    error: 'ok false',
  });
  assert.match(text, /host=dru\.fremontderby\.com/);
  assert.match(text, /kind=json/);
  assert.match(text, /status=503/);
  assert.match(text, /url=https:\/\/dru\.fremontderby\.com\/health\/environment/);
  assert.match(text, /error=ok false/);
  assert.doesNotMatch(text, /Still failing: run/);
});
