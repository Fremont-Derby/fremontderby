import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeStatusTone } from '../src/statusTone.js';

test('normalizeStatusTone maps aliases to canonical tones', () => {
  assert.equal(normalizeStatusTone('ok'), 'ok');
  assert.equal(normalizeStatusTone('SUCCESS'), 'ok');
  assert.equal(normalizeStatusTone('healthy'), 'ok');
  assert.equal(normalizeStatusTone('ready'), 'ok');
  assert.equal(normalizeStatusTone('error'), 'error');
  assert.equal(normalizeStatusTone('Critical'), 'error');
  assert.equal(normalizeStatusTone('danger'), 'error');
  assert.equal(normalizeStatusTone('warning'), 'warning');
  assert.equal(normalizeStatusTone('warn'), 'warning');
  assert.equal(normalizeStatusTone('muted'), 'muted');
  assert.equal(normalizeStatusTone('info'), 'muted');
  assert.equal(normalizeStatusTone('live'), 'live');
  assert.equal(normalizeStatusTone('tonight'), 'tonight');
  assert.equal(normalizeStatusTone('done'), 'done');
});

test('normalizeStatusTone falls back for empty/unknown', () => {
  assert.equal(normalizeStatusTone(null), 'muted');
  assert.equal(normalizeStatusTone(''), 'muted');
  assert.equal(normalizeStatusTone('unknown-tone'), 'muted');
  assert.equal(normalizeStatusTone('  ', 'ok'), 'ok');
  assert.equal(normalizeStatusTone('nope', 'warning'), 'warning');
});
