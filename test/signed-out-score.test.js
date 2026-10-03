import test from 'node:test';
import assert from 'node:assert/strict';
import { signedOutScoreLine } from '../src/signedOutScore.js';
import { renderScorePickerPage } from '../src/scorePickerPage.js';

test('a signed-out score page keeps the unsaved rack sentence', () => {
  assert.equal(signedOutScoreLine({ signedIn: false }), 'Sign in to score. The unsaved rack is still here.');
  assert.match(renderScorePickerPage(), /Sign in to score. The unsaved rack is still here/);
});
