import test from 'node:test';
import assert from 'node:assert/strict';
import { triageDefect } from '../src/qaTriage.js';

test('a failure needs a label, a summary, and an issue number', () => {
  assert.equal(triageDefect({ label: 'other', summary: 'x', issue: 1 }).ok, false);
  assert.equal(triageDefect({ label: 'layout', summary: '', issue: 1 }).ok, false);
  assert.equal(triageDefect({ label: 'layout', summary: 'dock covers the button', issue: 0 }).ok, false);
  const linked = triageDefect({ label: 'layout', summary: 'dock covers the button', issue: 2247 });
  assert.equal(linked.ok, true);
  assert.equal(linked.link, 'https://github.com/Fremont-Derby/fremontderby/issues/2247');
});
