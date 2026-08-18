import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTrackingCardNumbers } from '../scripts/check-pr-card-contract.mjs';

test('extractTrackingCardNumbers finds Tracks and Refs issue numbers', () => {
  const body = 'Tracks #1193\nRefs #42\n';
  assert.deepEqual(extractTrackingCardNumbers(body, 'Fremont-Derby/fremontderby').sort(), [42, 1193]);
});

test('extractTrackingCardNumbers accepts same-repo absolute issue URLs', () => {
  const body = 'Tracks https://github.com/Fremont-Derby/fremontderby/issues/1193';
  assert.deepEqual(extractTrackingCardNumbers(body, 'Fremont-Derby/fremontderby'), [1193]);
});
