import assert from 'node:assert/strict';
import test from 'node:test';
import { renderAvailabilityPage } from '../src/availabilityPage.js';
import { renderTeamsPage } from '../src/teamsPage.js';

test('availability page is framed as league night check-in', () => {
  const html = renderAvailabilityPage();
  assert.match(html, /League night check-in/);
  assert.match(html, /I'll be there/);
  assert.match(html, /Not sure yet/);
  assert.match(html, /Can't make it/);
  assert.match(html, /morning of the match/i);
  assert.match(html, /data-availability-status="available"/);
});

test('teams hub promotes weekly check-in', () => {
  const html = renderTeamsPage();
  assert.match(html, /Weekly check-in/);
  assert.match(html, /data-hub-availability href="\/schedule"/);
  assert.match(html, /Check in/);
});
