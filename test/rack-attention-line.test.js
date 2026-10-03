import test from 'node:test';
import assert from 'node:assert/strict';
import { rackAttentionLine } from '../src/rackAttentionLine.js';
import { renderNoticesPage } from '../src/noticesPage.js';

test('one disputed rack needs attention', () => {
  assert.equal(rackAttentionLine(1), '1 rack needs attention.');
  assert.equal(rackAttentionLine(2), '2 racks need attention.');
  assert.equal(rackAttentionLine(0), '');
});

test('notices page names messages instead of a missing route', () => {
  const html = renderNoticesPage();
  assert.match(html, /League notices are on the messages page/);
  assert.match(html, /href="\/messages"/);
  assert.match(html, /1 rack needs attention/);
});
