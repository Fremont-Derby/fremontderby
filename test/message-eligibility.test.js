import test from 'node:test';
import assert from 'node:assert/strict';
import { correctMessageLine, eligibilityLine } from '../src/messageEligibility.js';
import { renderChatPage } from '../src/chatPage.js';
import { renderProfilePage } from '../src/profilePage.js';

test('a sent message and an eligibility check are named', () => {
  assert.equal(correctMessageLine({ text: 'see you at the table' }), 'Sent: see you at the table');
  assert.equal(eligibilityLine({ payment: true, availability: true }), 'Eligible: payment set and availability set.');
  assert.equal(eligibilityLine({ payment: false, availability: true }), 'Not eligible: payment is missing.');
  assert.match(renderChatPage(), /Sent: see you at the table/);
  assert.match(renderProfilePage(), /Eligible: payment set and availability set/);
});
