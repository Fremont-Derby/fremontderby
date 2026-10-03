import test from 'node:test';
import assert from 'node:assert/strict';
import { clientErrorLine, qualityBaselineLine } from '../src/clientErrorLine.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';

test('a client error and a quality baseline are named', () => {
  assert.equal(clientErrorLine({ name: 'score save failed' }), 'Client error: score save failed.');
  assert.equal(qualityBaselineLine({ name: 'schedule', passed: 4 }), 'schedule baseline: 4 passed.');
  const html = renderAdminOperationsPage();
  assert.match(html, /Client error: score save failed/);
  assert.match(html, /schedule baseline: 4 passed/);
});
