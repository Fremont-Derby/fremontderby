#!/usr/bin/env node
/**
 * Operator-run demo roster seed.
 *
 * Creates unclaimed players and prepared teams for one registration/draft season
 * via existing service-role admin RPCs. Does not run during Cloudflare deploy.
 *
 * Required env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ACTOR_USER_ID   — UUID of an existing league admin
 *   SEED_SEASON_ID       — UUID of a draft or registration season
 *
 * Optional:
 *   SEED_APPLY=1         — actually mutate (default is dry-run)
 *   SEED_DATA_PATH       — override JSON path (default config/demo-league-seed.json)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env ${name}`);
  }
  return value;
}

async function rpc(baseUrl, serviceKey, fn, args) {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: JSON.stringify(args),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const message =
      body?.message || body?.error || body?.hint || text || response.statusText;
    const err = new Error(`${fn} failed (${response.status}): ${message}`);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

function firstRow(payload) {
  if (Array.isArray(payload)) return payload[0] ?? null;
  return payload;
}

async function main() {
  const apply = process.env.SEED_APPLY === '1';
  const dataPath = process.env.SEED_DATA_PATH
    ? path.resolve(process.env.SEED_DATA_PATH)
    : path.join(root, 'config/demo-league-seed.json');

  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  const teams = Array.isArray(data.teams) ? data.teams : [];
  const players = Array.isArray(data.players) ? data.players : [];

  console.log(`Seed file: ${dataPath}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN (set SEED_APPLY=1 to mutate)'}`);
  console.log(`Teams planned: ${teams.length}`);
  console.log(`Players planned: ${players.length}`);

  if (!apply) {
    console.log('\nDry-run sample teams:', teams.slice(0, 5).join(', '));
    console.log('Dry-run sample players:', players.slice(0, 5).join(', '));
    console.log('\nNo database writes performed.');
    return;
  }

  const baseUrl = required('SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const actorUserId = required('SEED_ACTOR_USER_ID');
  const seasonId = required('SEED_SEASON_ID');

  const createdTeams = [];
  for (const teamName of teams) {
    try {
      const row = firstRow(
        await rpc(baseUrl, serviceKey, 'admin_create_prepared_team', {
          actor_user_id: actorUserId,
          target_season_id: seasonId,
          team_name: teamName,
        }),
      );
      createdTeams.push({ name: teamName, id: row?.id ?? null });
      console.log(`team ok: ${teamName}`);
    } catch (error) {
      console.error(`team skip: ${teamName} — ${error.message}`);
    }
  }

  const createdPlayers = [];
  for (const displayName of players) {
    try {
      const row = firstRow(
        await rpc(baseUrl, serviceKey, 'admin_create_unclaimed_player', {
          actor_user_id: actorUserId,
          target_display_name: displayName,
          allow_exact_duplicate: false,
        }),
      );
      createdPlayers.push({
        name: displayName,
        id: row?.player_id ?? row?.id ?? null,
      });
      console.log(`player ok: ${displayName}`);
    } catch (error) {
      console.error(`player skip: ${displayName} — ${error.message}`);
    }
  }

  console.log('\nSummary');
  console.log(`Teams created: ${createdTeams.length}/${teams.length}`);
  console.log(`Players created: ${createdPlayers.length}/${players.length}`);
  console.log(
    'Note: this script prepares teams and unclaimed players only. Captain assignment and roster membership remain separate admin steps.',
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
