import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanHouseSettings, houseForFeed } from '../src/leagueHouseSettings.js';

test('an owner can save venue, table size, table count, and night', () => {
  const saved = cleanHouseSettings({ venue: 'House', tableSize: '7-foot', tableCount: 4, leagueNight: 'Wednesday' });
  assert.equal(saved.venue, 'House');
  assert.equal(saved.tableSize, '7-foot');
  assert.equal(saved.tableCount, 4);
  assert.equal(saved.leagueNight, 'Wednesday');
});

test('the feed uses the saved house and the match slot', () => {
  const feed = houseForFeed({ venue: 'House', tableSize: '7-foot', tableCount: 4 }, { slot_number: 2 });
  assert.equal(feed.venue, 'House');
  assert.equal(feed.tableNumber, 2);
});

test('a bad night is not saved', () => {
  assert.equal(cleanHouseSettings({ leagueNight: 'Tomorrow' }).leagueNight, null);
});
