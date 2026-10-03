import test from 'node:test';
import assert from 'node:assert/strict';
import { logLine, profileRecovery } from '../src/profileRecovery.js';

test('an edge failure tells the player to refresh', () => {
  assert.match(profileRecovery(502).text, /Refresh/);
  assert.doesNotMatch(profileRecovery(502).text, /<html|stack/i);
});

test('a log line drops a phone and a token', () => {
  const line = logLine({ action: 'save', lane: 'DRU', phone: '5550100', token: 'secret' });
  assert.equal(line.includes('555'), false);
  assert.equal(line.includes('secret'), false);
});
