import test from 'node:test';
import assert from 'node:assert/strict';
import { deployOrder, messageChannels, rulesVersion, sessionExpired, standingsLoad } from '../src/messageOps.js';

test('messages are direct, team, or general', () => {
  assert.deepEqual(messageChannels(), ['direct', 'team', 'general']);
});

test('the schema ships before the app', () => {
  assert.equal(deployOrder(false).next, 'schema');
  assert.equal(deployOrder(true).next, 'app');
});

test('a season names its rules version', () => {
  assert.equal(rulesVersion({ name: 'Spring', rules: '2026.1' }).text, 'Spring uses rules 2026.1.');
  assert.equal(rulesVersion({ name: 'Spring' }), null);
});

test('an expired session names the step to finish', () => {
  assert.match(sessionExpired('the lineup').text, /lineup/);
});

test('standings name the view instead of asking for another load', () => {
  assert.equal(standingsLoad('season').visible, true);
  assert.equal(standingsLoad(null).visible, false);
});
