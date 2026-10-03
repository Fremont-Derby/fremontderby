import test from 'node:test';
import assert from 'node:assert/strict';
import { previewPathLine, humanLaunchLine } from '../src/previewLaunch.js';
import { renderProfilePage } from '../src/profilePage.js';

test('preview is not the tester path and the launch is named', () => {
  assert.equal(previewPathLine({ tester: false }), 'Preview is not the tester path.');
  assert.equal(humanLaunchLine({ name: 'find my team' }), 'Launch: find my team.');
  const html = renderProfilePage();
  assert.match(html, /Preview is not the tester path/);
  assert.match(html, /Launch: find my team/);
});
