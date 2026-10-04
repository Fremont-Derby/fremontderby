import test from 'node:test';
import assert from 'node:assert/strict';
import { privacyContractLine, campaignLine } from '../src/privacyCampaign.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a privacy contract and a campaign are named', () => {
  assert.equal(privacyContractLine({ field: 'phone' }), 'Privacy: phone is stored as a label, not a value.');
  assert.equal(campaignLine({ name: 'player mission' }), 'Campaign: player mission.');
  const html = renderProfilePage();
  assert.doesNotMatch(html, /Privacy: phone is stored as a label, not a value/);
  assert.doesNotMatch(html, /Campaign: player mission/);
});
