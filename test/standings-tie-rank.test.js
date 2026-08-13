import assert from 'node:assert/strict';
import test from 'node:test';
import { renderStandingsPage } from '../src/standingsPage.js';

test('standings page annotates tied ranks with T- prefix helper', () => {
  const html = renderStandingsPage();
  assert.match(html, /function rankLabel/);
  assert.match(html, /T-\'\+rank|T-"\+rank|T-'\s*\+\s*rank/);
  assert.match(html, /rankLabel\(rows,index\)|rankLabel\(list,index\)/);
});
