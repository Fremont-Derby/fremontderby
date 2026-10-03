import test from 'node:test';
import assert from 'node:assert/strict';
import { shortPathLine, publicProofLine } from '../src/pathLine.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a short path and a public proof are named', () => {
  assert.equal(shortPathLine({ name: 'check in' }), 'Short path: check in.');
  assert.equal(publicProofLine({ name: 'standings' }), 'Public proof: standings.');
  const html = renderProfilePage();
  assert.match(html, /Short path: check in/);
  assert.match(html, /Public proof: standings/);
});
