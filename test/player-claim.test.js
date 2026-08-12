import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createPlayerClaimRepository } from '../src/playerClaimRepository.js';
import { enhanceProfilePlayerClaim } from '../src/profilePlayerClaimEnhancer.js';

const migrationPath = new URL(
  '../supabase/migrations/20260812050000_claim_unclaimed_player.sql',
  import.meta.url,
);
const routerEntryPath = new URL('../src/routerEntry.js', import.meta.url);

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('claim migration enforces unclaimed zero-rack identity integrity and concurrency', async () => {
  const sql = await readFile(migrationPath, 'utf8');
  assert.match(sql, /p\.user_id is null/);
  assert.match(sql, /Player is already claimed/);
  assert.match(sql, /You already have a player profile/);
  assert.match(sql, /public\.player_match_racks/);
  assert.match(sql, /private\.player_match_score_submissions/);
  assert.match(sql, /jsonb_array_length\(coalesce\(submission\.racks, '\[\]'::jsonb\)\) > 0/);
  assert.match(sql, /Player has game history and cannot be self-claimed/);
  assert.doesNotMatch(sql, /pm\.status\s*=\s*'finalized'/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /for update/);
  assert.match(sql, /set user_id = actor_user_id/);
  assert.match(sql, /player\.self_claim/);
  assert.match(sql, /insert into private\.audit_events/);
  assert.doesNotMatch(sql, /update public\.team_memberships/);
  assert.match(sql, /revoke all on function public\.get_player_claim_options[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.get_player_claim_options[\s\S]*to service_role/);
  assert.match(sql, /revoke all on function public\.claim_unclaimed_player[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.claim_unclaimed_player[\s\S]*to service_role/);
});

test('claim repository uses service-role RPCs and preserves human context', async () => {
  const requests = [];
  const responses = [
    [{
      options: {
        canClaim: true,
        reason: null,
        players: [{
          playerId: 'player-1',
          displayName: 'Prepared Player',
          teamNames: ['Corner Pocket'],
          seasonNames: ['Fremont Derby Season 1'],
        }],
      },
    }],
    [{ player_id: 'player-1', display_name: 'Prepared Player' }],
  ];
  const repository = createPlayerClaimRepository(
    {
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        return jsonResponse(responses.shift());
      },
    },
  );

  const options = await repository.getOptions({ actorUserId: 'user-1', search: 'Prepared' });
  assert.equal(options.canClaim, true);
  assert.deepEqual(options.players[0].teamNames, ['Corner Pocket']);
  assert.match(requests[0].url, /\/rpc\/get_player_claim_options$/);
  assert.equal(requests[0].init.headers.authorization, 'Bearer service-secret');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    actor_user_id: 'user-1',
    search_text: 'Prepared',
  });

  const player = await repository.claim({ actorUserId: 'user-1', playerId: 'player-1' });
  assert.deepEqual(player, { playerId: 'player-1', displayName: 'Prepared Player' });
  assert.match(requests[1].url, /\/rpc\/claim_unclaimed_player$/);
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    actor_user_id: 'user-1',
    target_player_id: 'player-1',
  });
});

test('Profile claim enhancer is mobile-first, human-readable, and does not show technical identifiers', async () => {
  const source = '<!doctype html><html><head></head><body><section class="stack" data-authenticated-content hidden><article class="panel">Profile</article></section></body></html>';
  const response = await enhanceProfilePlayerClaim(new Response(source, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  }));
  const html = await response.text();
  assert.match(html, /Claim existing player/);
  assert.match(html, /Only unclaimed players with no competitive racks can be claimed here/);
  assert.match(html, /Search players/);
  assert.match(html, /Claim '\+player\.displayName/);
  assert.match(html, /Claim '\+name\+' as my player profile\?/);
  assert.match(html, /No claimable player matches that name/);
  assert.match(html, /Has game history|game history/);
  assert.match(html, /\/api\/me\/player-claim-options/);
  assert.match(html, /\/api\/me\/player-claim/);
  assert.match(html, /min-height:48px/);
  assert.match(html, /@media\(max-width:600px\)/);
  assert.doesNotMatch(html, /auth user id|supabase id|service role|uuid/i);
  assert.ok(
    html.indexOf('Claim existing player') < html.indexOf('>Profile<'),
    'claim prompt appears before normal profile creation',
  );
});

test('router entry resolves claim APIs before legacy routing and enhances Profile', async () => {
  const source = await readFile(routerEntryPath, 'utf8');
  assert.match(source, /routePlayerClaim/);
  assert.match(source, /enhanceProfilePlayerClaim/);
  assert.match(source, /const playerClaimResponse = await routePlayerClaim\(request, env\)/);
  assert.match(source, /enhanceProfilePlayerClaim\(withSeasonRegistration\)/);
  const claimIndex = source.indexOf('routePlayerClaim(request, env)');
  const legacyIndex = source.indexOf('legacyRouter.fetch(request, env, ctx)');
  assert.ok(claimIndex > -1 && claimIndex < legacyIndex);
});
