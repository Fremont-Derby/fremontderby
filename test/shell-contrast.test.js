import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the menu contrast can be named', () => {
  const src = readFileSync(new URL('../src/shellContrast.js', import.meta.url), 'utf8');
  assert.match(src, /function shellContrastLabel/);
  assert.match(src, /Menu contrast needs a check/);
});

test("a profile can name its status", () => {
  const src = readFileSync(new URL("../src/profileStatus.js", import.meta.url), "utf8");
  assert.match(src, /function profileStatusLabel/);
  assert.match(src, /Profile needs a status/);
});

test("a player rating can be named", () => {
  const src = readFileSync(new URL("../src/ratingStatus.js", import.meta.url), "utf8");
  assert.match(src, /function ratingStatusLabel/);
  assert.match(src, /Rating is missing/);
});

test("a profile can name a missing phone", () => {
  const src = readFileSync(new URL("../src/phoneStatus.js", import.meta.url), "utf8");
  assert.match(src, /function phoneStatusLabel/);
  assert.match(src, /Phone is missing/);
});

test("a profile can name a missing phone", () => {
  const src = readFileSync(new URL("../src/phoneStatus.js", import.meta.url), "utf8");
  assert.match(src, /function phoneStatusLabel/);
  assert.match(src, /Phone is missing/);
});

test("a profile can name a missing phone", () => {
  const src = readFileSync(new URL("../src/phoneStatus.js", import.meta.url), "utf8");
  assert.match(src, /function phoneStatusLabel/);
  assert.match(src, /Phone is missing/);
});

test("a team can name a missing captain", () => {
  const src = readFileSync(new URL("../src/captainStatus.js", import.meta.url), "utf8");
  assert.match(src, /function captainStatusLabel/);
  assert.match(src, /Captain is missing/);
});
