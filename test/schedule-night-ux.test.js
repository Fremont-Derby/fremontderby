import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSchedulePage } from '../src/schedulePage.js';

test('schedule page labels live matches and prefers score-live CTA copy', () => {
  const html = renderSchedulePage();
  assert.match(html, /status-pill/);
  assert.match(html, /Score live/);
  assert.match(html, /in_progress/);
  assert.match(html, /statusTone/);
  assert.match(html, /match\[data-status/);
});
