import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderTeamsPage } from '../src/teamsPage.js';
import { renderSchedulePage } from '../src/schedulePage.js';
import {
  proposeTeamMatchMakeupCommand,
  respondTeamMatchMakeupCommand,
} from '../src/makeupCommands.js';

test('teams page ships league night checklist and eligible sub board', () => {
  const html = renderTeamsPage();
  assert.match(html, /League night checklist/);
  assert.match(html, /data-night-checklist/);
  assert.match(html, /Eligible subs/);
  assert.match(html, /eligible-free-agents/);
  assert.match(html, /renderLeagueNightChecklist/);
});

test('schedule page supports makeup propose and respond', () => {
  const html = renderSchedulePage();
  assert.match(html, /Propose makeup/);
  assert.match(html, /proposeMakeup/);
  assert.match(html, /\/api\/team-matches\//);
  assert.match(html, /makeup\/respond/);
});

test('makeup commands validate date and responses', async () => {
  const calls = [];
  const repository = {
    async proposeTeamMatchMakeup(payload) {
      calls.push(['propose', payload]);
      return { teamMatchId: payload.teamMatchId, makeupStatus: 'proposed', makeupOn: payload.makeupOn };
    },
    async respondTeamMatchMakeup(payload) {
      calls.push(['respond', payload]);
      return { teamMatchId: payload.teamMatchId, makeupStatus: payload.response };
    },
  };
  await proposeTeamMatchMakeupCommand(
    { actorUserId: 'u1', teamMatchId: 'm1', makeupOn: '2026-08-21', makeupLocation: 'Fremont Bowl' },
    repository,
  );
  await respondTeamMatchMakeupCommand(
    { actorUserId: 'u2', teamMatchId: 'm1', response: 'accepted' },
    repository,
  );
  assert.equal(calls[0][1].makeupOn, '2026-08-21');
  assert.equal(calls[1][1].response, 'accepted');
  await assert.rejects(
    () => proposeTeamMatchMakeupCommand({ actorUserId: 'u1', teamMatchId: 'm1', makeupOn: 'soon' }, repository),
    /YYYY-MM-DD/,
  );
});

test('makeup migration defines captain propose/respond RPCs', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260814150000_team_match_makeup.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /propose_team_match_makeup/);
  assert.match(sql, /respond_team_match_makeup/);
  assert.match(sql, /makeup_on/);
});
