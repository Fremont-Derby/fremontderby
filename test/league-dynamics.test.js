import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';

test('captain hub surfaces lineup deadline urgency', () => {
  const html = renderTeamsPage();
  assert.match(html, /lineupDeadlineLabel/);
  assert.match(html, /Lock lineup now/);
  assert.match(html, /lineupDeadlineAt/);
});

test('schedule shows lineup due timing when the round carries a deadline', () => {
  const html = renderSchedulePage();
  assert.match(html, /deadlineHint/);
  assert.match(html, /lineupDeadlineAt|lineup_deadline_at/);
});

test('league dynamics doc covers season arc and weekly loop', () => {
  const docs = readFileSync(new URL('../docs/league-ops-patterns.md', import.meta.url), 'utf8');
  assert.match(docs, /Season arc/);
  assert.match(docs, /Weekly loop/);
  assert.match(docs, /Playoffs/);
  assert.match(docs, /not about display names/);
});
