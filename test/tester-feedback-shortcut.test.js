import test from 'node:test';
import assert from 'node:assert/strict';
import { testerFeedbackScript } from '../src/testerFeedbackShortcut.js';

test('tester feedback link prefills route and version', () => {
  const source = testerFeedbackScript();
  assert.match(source, /Report a problem/);
  assert.match(source, /versionTag/);
  assert.match(source, /location\.pathname/);
});
