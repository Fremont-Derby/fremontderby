import assert from 'node:assert/strict';
import test from 'node:test';
import { renderFreeAgentsPage } from '../src/freeAgentsPage.js';
import { repairAdminPlayersScript } from '../src/adminPlayersScriptRepair.js';

test('free agents page sends humans to Teams', () => {
  const html = renderFreeAgentsPage();
  assert.match(html, /No open roster list is published yet/);
  assert.doesNotMatch(html, /bindings are healthy/);
});

test('admin players search placeholder stays short', () => {
  const html = repairAdminPlayersScript('placeholder="Type part of a name — e.g. \u201cjen\u201d or \u201cbreakers\u201d"');
  assert.match(html, /placeholder="Search by player or team"/);
});
