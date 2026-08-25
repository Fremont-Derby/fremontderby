import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { injectPlayerSurfaceTheme, playerSurfaceThemeStyles } from '../src/playerSurfaceTheme.js';

test('availability is a modern light player surface with scoped readable colors', async () => {
  const response = new Response('<!doctype html><html><head></head><body><main class="app"><section class="panel"><div class="answer"><strong>Not marked</strong></div></section></main></body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });

  const themed = await injectPlayerSurfaceTheme(response, '/availability');
  const html = await themed.text();

  assert.match(html, /data-fd-player-surface="availability"/);
  assert.match(html, /body\[data-fd-player-surface="availability"\] \.panel/);
  assert.match(playerSurfaceThemeStyles, /body\[data-fd-player-surface="availability"\][\s\S]*background: var\(--fd-bg-surface\) !important/);
  assert.match(playerSurfaceThemeStyles, /body\[data-fd-player-surface="availability"\][\s\S]*color: var\(--fd-text\) !important/);
  assert.match(playerSurfaceThemeStyles, /body\[data-fd-player-surface="availability"\][\s\S]*\.context span[\s\S]*color: var\(--fd-text-muted\) !important/);
});

test('date availability migration accepts active roster participation without weakening unaffiliated checks', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260825031800_checkin_participation_eligibility.sql', import.meta.url), 'utf8');

  assert.match(sql, /from public\.season_players sp/);
  assert.match(sql, /sp\.status = 'active'/);
  assert.match(sql, /or exists \(\s*select 1\s*from public\.team_memberships tm/);
  assert.match(sql, /tm\.ends_at is null/);
  assert.match(sql, /Active season participation is required to set availability/);
  assert.doesNotMatch(sql, /coalesce\(pda\.status, 'unsure'/);
  assert.match(sql, /select[\s\S]*pda\.status,[\s\S]*is_participant/);
});
