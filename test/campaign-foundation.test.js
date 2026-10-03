import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignFoundationLine } from '../src/campaignFoundation.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a campaign foundation is named', () => {
  assert.equal(campaignFoundationLine({ name: 'find my team' }), 'Campaign: find my team.');
  assert.match(renderProfilePage(), /Campaign: find my team/);
});
