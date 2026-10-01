import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInContrast, formatPhone, moreMenuItem, oneCaptaincy, qualificationProgress } from '../src/profileOps.js';

test('check-in names the person and the status', () => {
  assert.equal(checkInContrast({ name: 'Eli', status: 'yes' }).text, 'Eli is yes.');
  assert.equal(checkInContrast({ name: 'Eli' }).ok, false);
});

test('eligibility progress counts requirements', () => {
  assert.equal(qualificationProgress({ done: 2, need: 3 }).text, '2 of 3 requirements met.');
});

test('a More menu item has a readable label', () => {
  assert.equal(moreMenuItem({ label: 'Schedule' }).contrast, 'readable');
});

test('a phone number is formatted or rejected', () => {
  assert.equal(formatPhone('2065550100'), '(206) 555-0100');
  assert.equal(formatPhone('555'), null);
});

test('an actor cannot hold two captaincies', () => {
  assert.equal(oneCaptaincy([{ captain: true }, { captain: true }]).ok, false);
  assert.equal(oneCaptaincy([{ captain: true }]).ok, true);
});
