import test from 'node:test';
import assert from 'node:assert/strict';
import { druModernRequested } from '../src/druModernSwitch.js';

test('the modern shell stays off unless the page asks for it', () => {
  const classic = new Request('https://dru.fremontderby.com/schedule');
  const modern = new Request('https://dru.fremontderby.com/schedule?ui=modern');
  assert.equal(druModernRequested(classic), false);
  assert.equal(druModernRequested(modern), true);
  assert.equal(druModernRequested(new Request('https://dru.fremontderby.com/schedule', { method: 'POST' })), false);
});
