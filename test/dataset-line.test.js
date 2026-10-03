import test from 'node:test';
import assert from 'node:assert/strict';
import { datasetLine, shadowModelLine } from '../src/datasetLine.js';
import { renderAdminOperationsPage } from '../src/adminOperationsPage.js';

test('a dataset and a shadow model are named', () => {
  assert.equal(datasetLine({ name: 'defects', rows: 12 }), 'Dataset defects: 12 rows.');
  assert.equal(shadowModelLine({ name: 'ranking' }), 'Shadow model: ranking.');
  const html = renderAdminOperationsPage();
  assert.match(html, /Dataset defects: 12 rows/);
  assert.match(html, /Shadow model: ranking/);
});
