import test from 'node:test';
import assert from 'node:assert/strict';
import { checkinBurst, cloudflareHtml, mockSeason, oneCaptaincy, standingsMode } from '../src/standingsOps.js';

test('standings names the mode', () => {
  assert.equal(standingsMode('points'), 'points');
  assert.match(standingsMode('').text, /missing/);
});

test('a person can captain only one open season', () => {
  assert.equal(oneCaptaincy([{ captain: true }, { captain: true }]).ok, false);
  assert.equal(oneCaptaincy([{ captain: true }]).ok, true);
});

test('check-in sends one request', () => {
  assert.equal(checkinBurst([1, 2]).ok, false);
});

test('a mock season stays at two teams', () => {
  assert.equal(mockSeason({ teams: ['Owls', 'Sharks', 'Bears'] }).ok, false);
});

test('a Cloudflare page is not data', () => {
  assert.equal(cloudflareHtml('<html>').ok, false);
  assert.equal(cloudflareHtml('{"ok":true}').ok, true);
});
