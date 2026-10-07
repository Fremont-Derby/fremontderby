import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedBlindLineupControllerSource, sharedBlindLineupStyles } from '../src/blindLineupComponent.js';

test('editing a submitted lineup withdraws it before mutating slots', () => {
  assert.match(sharedBlindLineupControllerSource, /async function beginEdit\(\)/);
  assert.match(sharedBlindLineupControllerSource, /if\(!ownSubmitted\)return/);
  assert.match(sharedBlindLineupControllerSource, /await adapter\.submit\(\[\]\)/);
  assert.match(sharedBlindLineupControllerSource, /ownSubmitted=false/);
  assert.match(sharedBlindLineupControllerSource, /notifyOwnUnsubmitted\(\)/);
  assert.match(sharedBlindLineupControllerSource, /async function removeSlot\(index\)\{await beginEdit\(\);selectedSlots\[index\]=null/);
  assert.match(sharedBlindLineupControllerSource, /async function moveSlot\(from,to\).*await beginEdit\(\)/);
  assert.match(sharedBlindLineupControllerSource, /async function forfeitSlot\(index\)\{await beginEdit\(\)/);
});

test('submitted lineup requires a fresh submit after any change', () => {
  assert.match(sharedBlindLineupControllerSource, /Changing any slot will withdraw it and require you to submit again\./);
  assert.match(sharedBlindLineupControllerSource, /mobileSubmitButton\.disabled=lineupLocked\|\|ownSubmitted\|\|filled!==3/);
  assert.match(sharedBlindLineupControllerSource, /submitButton\.disabled=lineupLocked\|\|ownSubmitted\|\|filled!==3/);
  assert.match(sharedBlindLineupControllerSource, /Any later change will withdraw it and require another submit\./);
});

test('mobile lineup has direct up and down reorder controls', () => {
  assert.match(sharedBlindLineupControllerSource, /data.*mobileMoveUp/);
  assert.match(sharedBlindLineupControllerSource, /data.*mobileMoveDown/);
  assert.match(sharedBlindLineupControllerSource, /Move slot '\+\(index\+1\)\+' up/);
  assert.match(sharedBlindLineupControllerSource, /Move slot '\+\(index\+1\)\+' down/);
  assert.match(sharedBlindLineupControllerSource, /button\.dataset\.mobileMoveUp/);
  assert.match(sharedBlindLineupControllerSource, /button\.dataset\.mobileMoveDown/);
  assert.match(sharedBlindLineupStyles, /\.mobile-slot-actions\{display:flex/);
});
