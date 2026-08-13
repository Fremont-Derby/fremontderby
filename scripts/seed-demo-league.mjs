#!/usr/bin/env node
/**
 * Operator-run mock league seed (full-ish lifecycle).
 *
 * Phases (selected with SEED_SCENARIO):
 *   players      — unclaimed players only
 *   registration — season setup + 8 prepared teams + players
 *   active       — registration phase + publish 7-round / 28-match schedule
 *   all          — players on existing season id only, then registration + active
 *                  (active creates a second season when possible)
 *
 * Default: dry-run (no writes). Set SEED_APPLY=1 to mutate.
 *
 * Required for apply:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ACTOR_USER_ID   — existing league admin user UUID (audit actor)
 *
 * Optional:
 *   SEED_SEASON_ID       — reuse this season for team attach (registration/draft only)
 *   SEED_SCENARIO        — players | registration | active | all (default: all)
 *   SEED_DATA_PATH       — override JSON path
 *
 * Not covered here (needs live scoring / captain flows or extra RPCs):
 *   dual rack entry, finalize, prize money amounts, phone numbers, messages
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateRoundRobin } from '../domain/schedule.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name}`);
  return value;
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
    throw new Error(`${fn} failed (${response.status}): ${message}`);
  }
  return body;
}

function firstRow(payload) {
  if (Array.isArray(payload)) return payload[0] ?? null;
  return payload;
}

async function createPlayers(ctx, names) {
  const created = [];
  for (const displayName of names) {
    try {
      const row = firstRow(
        await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_create_unclaimed_player', {
          actor_user_id: ctx.actorUserId,
          target_display_name: displayName,
          allow_exact_duplicate: false,
        }),
      );
      created.push({ name: displayName, id: row?.player_id ?? null });
      console.log(`  player ok: ${displayName}`);
    } catch (error) {
      console.error(`  player skip: ${displayName} — ${error.message}`);
    }
  }
  return created;
}

async function configureSeason(ctx, seasonConfig, existingSeasonId = null) {
  const row = firstRow(
    await rpc(ctx.baseUrl, ctx.serviceKey, 'configure_season_setup', {
      actor_user_id: ctx.actorUserId,
      target_season_id: existingSeasonId,
      configured_season_name: seasonConfig.name,
      configured_league_night: seasonConfig.leagueNight,
      configured_first_round_date: seasonConfig.firstRoundDate,
      configured_roster_lock_round: seasonConfig.rosterLockRound,
      configured_opening_block_length: seasonConfig.openingBlockLength,
      configured_individual_min_matches: seasonConfig.individualMinMatches,
      configured_round_interval_days: seasonConfig.roundIntervalDays,
      configured_table_numbers: seasonConfig.tableNumbers,
      configured_race_chart_version: seasonConfig.raceChartVersion,
      configured_playoff_team_count: seasonConfig.playoffTeamCount,
      configured_playoff_anchor_tiebreaker: seasonConfig.playoffAnchorTiebreaker,
    }),
  );
  const id = row?.id ?? existingSeasonId;
  console.log(`  season ok: ${seasonConfig.name} (${id}) status=${row?.status ?? 'unknown'}`);
  return { id, status: row?.status ?? 'registration', row };
}

async function createPreparedTeams(ctx, seasonId, teamNames) {
  const created = [];
  for (const teamName of teamNames) {
    try {
      const row = firstRow(
        await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_create_prepared_team', {
          actor_user_id: ctx.actorUserId,
          target_season_id: seasonId,
          team_name: teamName,
        }),
      );
      const id = row?.id ?? null;
      created.push({ name: teamName, id });
      console.log(`  team ok: ${teamName} (${id})`);
    } catch (error) {
      console.error(`  team skip: ${teamName} — ${error.message}`);
    }
  }
  return created;
}

function buildRoundsPayload(teamIds, firstRoundDate, intervalDays, tableNumbers) {
  const rr = generateRoundRobin(teamIds);
  const tables = tableNumbers?.length ? tableNumbers : [1, 2, 3, 4];
  return rr.map((round) => ({
    roundNumber: round.round,
    stage: 'regular',
    scheduledOn: addDays(firstRoundDate, (round.round - 1) * intervalDays),
    matches: round.matches.map((match, index) => ({
      tableNumber: tables[index % tables.length],
      teamAId: match.teamA,
      teamBId: match.teamB,
    })),
  }));
}

async function publishSchedule(ctx, seasonId, previousStatus, rounds) {
  const row = firstRow(
    await rpc(ctx.baseUrl, ctx.serviceKey, 'publish_season_schedule', {
      target_season_id: seasonId,
      actor_user_id: ctx.actorUserId,
      expected_previous_status: previousStatus,
      rounds_payload: rounds,
    }),
  );
  console.log(
    `  schedule ok: rounds=${row?.round_count ?? '?'} matches=${row?.team_match_count ?? '?'}`,
  );
  return row;
}

async function main() {
  const apply = process.env.SEED_APPLY === '1';
  const scenario = (process.env.SEED_SCENARIO || 'all').toLowerCase();
  const dataPath = process.env.SEED_DATA_PATH
    ? path.resolve(process.env.SEED_DATA_PATH)
    : path.join(root, 'config/demo-league-seed.json');
  const data = JSON.parse(await readFile(dataPath, 'utf8'));

  const teams = [...(data.teams || [])];
  const extraTeams = data.extraTeams || [];
  const players = data.players || [];
  const registration = data.scenarios?.registration;
  const active = data.scenarios?.active;

  console.log(`Seed file: ${dataPath}`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN (set SEED_APPLY=1 to mutate)'}`);
  console.log(`Players: ${players.length}`);
  console.log(`Core teams (8 for schedule): ${teams.length}`);
  console.log(`Extra teams: ${extraTeams.length}`);

  if (!apply) {
    console.log('\nPlanned lifecycle coverage:');
    console.log('  1. Unclaimed players (admin_create_unclaimed_player)');
    console.log('  2. Registration/draft season setup (configure_season_setup)');
    console.log('  3. Eight prepared teams (admin_create_prepared_team)');
    console.log('  4. Optional second active season + publish_season_schedule (7 rounds / 28 matches)');
    console.log('  5. NOT auto-seeded: dual rack scoring, finalize, prizes $, phones, messages');
    console.log('\nNo database writes performed.');
    return;
  }

  const ctx = {
    baseUrl: required('SUPABASE_URL').replace(/\/$/, ''),
    serviceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    actorUserId: required('SEED_ACTOR_USER_ID'),
  };

  if (scenario === 'players' || scenario === 'all' || scenario === 'registration' || scenario === 'active') {
    console.log('\nPhase: players');
    await createPlayers(ctx, players);
  }

  if (scenario === 'registration' || scenario === 'all' || scenario === 'active') {
    console.log('\nPhase: registration season + teams');
    const existingId = process.env.SEED_SEASON_ID || null;
    const seasonInfo = await configureSeason(
      ctx,
      registration.season,
      existingId,
    );
    const teamRows = await createPreparedTeams(ctx, seasonInfo.id, teams);
    const readyIds = teamRows.map((t) => t.id).filter(Boolean);
    console.log(`  prepared teams with ids: ${readyIds.length}`);

    if (scenario === 'active' || scenario === 'all') {
      if (readyIds.length !== 8) {
        console.error(
          `  cannot publish schedule: need exactly 8 team ids, have ${readyIds.length}. Fix team creates or use a clean registration season.`,
        );
      } else if (scenario === 'active') {
        // Publish on the same season (registration -> active)
        console.log('\nPhase: publish schedule on registration season (becomes active)');
        const rounds = buildRoundsPayload(
          readyIds,
          registration.season.firstRoundDate,
          registration.season.roundIntervalDays,
          registration.season.tableNumbers,
        );
        await publishSchedule(
          ctx,
          seasonInfo.id,
          seasonInfo.status || 'registration',
          rounds,
        );
      } else {
        // scenario all: try a second season for active demo with extra name
        console.log('\nPhase: active demo season + schedule');
        try {
          const activeInfo = await configureSeason(ctx, active.season, null);
          const activeTeams = await createPreparedTeams(ctx, activeInfo.id, teams.map((n) => `${n} · Active`));
          const activeIds = activeTeams.map((t) => t.id).filter(Boolean);
          if (activeIds.length === 8) {
            const rounds = buildRoundsPayload(
              activeIds,
              active.season.firstRoundDate,
              active.season.roundIntervalDays,
              active.season.tableNumbers,
            );
            await publishSchedule(
              ctx,
              activeInfo.id,
              activeInfo.status || 'registration',
              rounds,
            );
          } else {
            console.error(`  active season teams incomplete (${activeIds.length}/8); schedule not published`);
          }
        } catch (error) {
          console.error(`  active season phase failed: ${error.message}`);
          console.error('  (Often caused by an existing registration season lock — set SEED_SEASON_ID or SEED_SCENARIO=active on a clean season.)');
        }
      }
    }
  }

  console.log('\nDone.');
  console.log('Next manual/product steps for a full league night path:');
  console.log('  - Assign captains and roster players onto teams');
  console.log('  - Enter dual rack ledgers and finalize matchups');
  console.log('  - Configure prize amounts if money UI should be non-zero');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
