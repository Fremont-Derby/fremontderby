import assert from 'node:assert/strict';
import test from 'node:test';
import { jsonNoStore, jsonPublic } from '../src/httpJson.js';
import { normalizeStatusTone } from '../src/statusTone.js';
import { createStatusController } from '../src/statusController.js';

test('Facade: jsonNoStore sets no-store cache header', async () => {
  const response = jsonNoStore({ ok: true }, 201);
  assert.equal(response.status, 201);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.deepEqual(await response.json(), { ok: true });
});

test('Facade: jsonPublic allows short caching', () => {
  const response = jsonPublic({ seasons: [] });
  assert.match(response.headers.get('cache-control'), /public/);
});

test('Strategy: status tones normalize to a small palette', () => {
  assert.equal(normalizeStatusTone('healthy'), 'ok');
  assert.equal(normalizeStatusTone('critical'), 'error');
  assert.equal(normalizeStatusTone('warn'), 'warning');
  assert.equal(normalizeStatusTone('ready'), 'ok');
  assert.equal(normalizeStatusTone(''), 'muted');
});

test('Factory/Null Object: status controller no-ops without element', () => {
  const status = createStatusController(null);
  assert.doesNotThrow(() => status.set('Hello', 'ok'));
  assert.doesNotThrow(() => status.clear());
});

test('Factory: status controller writes normalized tone', () => {
  const el = { textContent: '', dataset: {}, removeAttribute(name) { delete this.dataset[name.replace('data-', '')]; } };
  // minimal stub
  const node = {
    textContent: '',
    dataset: {},
    removeAttribute(attr) {
      if (attr === 'data-tone') delete this.dataset.tone;
    },
  };
  const status = createStatusController(node);
  status.set('All good', 'healthy');
  assert.equal(node.textContent, 'All good');
  assert.equal(node.dataset.tone, 'ok');
  status.clear();
  assert.equal(node.textContent, '');
});
