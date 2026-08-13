#!/usr/bin/env node
/**
 * Operator-run mock league seed — mid-season oriented.
 *
 * Builds example players (with phones), captains, rosters, team messages,
 * a registration season, and/or an active season with a full schedule whose
 * first rounds fall in the past (half-season calendar).
 *
 * Default: dry-run. Set SEED_APPLY=1 to mutate.
 *
 * Required for apply:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ACTOR_USER_ID
 *
 * Optional:
 *   SEED_SCENARIO=all|registration|active|players
 *   SEED_SEASON_ID
 *   SEED_DATA_PATH
 *
 * Requires migration 20260813010000_admin_demo_seed_helpers.sql for phones/messages.
 *
 * Still not simulated end-to-end: dual rack entry, match finalize, prize $.
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

function playerName(entry) {
  return typeof entry === 'string' ? entry : entry.name;
}

function playerPhone(entry) {
  if (typeof entry === 'string') return null;
  return entry.phone ?? null;
}

function teamName(entry) {
  return typeof entry === 'string' ? entry : entry.name;
}

function teamRosterSize(entry) {
  if (typeof entry === 'string') return 3;
  return Number(entry.rosterSize) || 3;
}

function teamEdge(entry) {
  if (typeof entry === 'string') return 'normal';
  return entry.edge || 'normal';
}

async function createPlayers(ctx, entries) {
  const created = [];
  for (const entry of entries) {
    const name = playerName(entry);
    try {
      const row = firstRow(
        await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_create_unclaimed_player', {
          actor_user_id: ctx.actorUserId,
          target_display_name: name,
          allow_exact_duplicate: false,
        }),
      );
      const id = row?.player_id ?? null;
      const phone = playerPhone(entry);
      if (id && phone) {
        try {
          await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_seed_player_phone', {
            actor_user_id: ctx.actorUserId,
            target_player_id: id,
            profile_phone: phone,
          });
        } catch (error) {
          console.error(`  phone skip: ${name} — ${error.message}`);
        }
      }
      created.push({
        name,
        id,
        phone,
        edge: typeof entry === 'object' ? entry.edge : null,
      });
      console.log(`  player ok: ${name}${phone ? ' (phone)' : ' (no phone)'}`);
    } catch (error) {
      console.error(`  player skip: ${name} — ${error.message}`);
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
  return { id, status: row?.status ?? 'registration', config: seasonConfig };
}

async function createTeamsWithCaptainsAndRosters(ctx, seasonId, teamEntries, players, messages) {
  const pool = players.filter((p) => p.id);
  let poolIndex = 0;
  const take = (n) => {
    const slice = pool.slice(poolIndex, poolIndex + n);
    poolIndex += n;
    return slice;
  };

  const createdTeams = [];
  for (const entry of teamEntries) {
    const name = teamName(entry);
    const rosterSize = teamRosterSize(entry);
    const edge = teamEdge(entry);
    let teamId = null;
    try {
      const row = firstRow(
        await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_create_prepared_team', {
          actor_user_id: ctx.actorUserId,
          target_season_id: seasonId,
          team_name: name,
        }),
      );
      teamId = row?.id ?? null;
      console.log(`  team ok: ${name} (${teamId}) edge=${edge}`);
    } catch (error) {
      console.error(`  team skip: ${name} — ${error.message}`);
      continue;
    }

    const members = take(Math.max(rosterSize, 1));
    if (!members.length) {
      console.error(`  roster skip: ${name} — no players left`);
      createdTeams.push({ name, id: teamId, edge, captainId: null, members: [] });
      continue;
    }

    const captain = members[0];
    // Ensure captain has phone before active seasons; seed a fallback if missing
    if (!captain.phone && captain.id) {
      try {
        await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_seed_player_phone', {
          actor_user_id: ctx.actorUserId,
          target_player_id: captain.id,
          profile_phone: '2065550199',
        });
        captain.phone = '2065550199';
        console.log(`  phone fallback for captain: ${captain.name}`);
      } catch (error) {
        console.error(`  captain phone skip: ${captain.name} — ${error.message}`);
      }
    }

    // Roster non-captains first as players, then assign captain
    for (let i = 1; i < members.length; i += 1) {
      const member = members[i];
      try {
        await rpc(ctx.baseUrl, ctx.serviceKey, 'set_admin_player_team_membership', {
          actor_user_id: ctx.actorUserId,
          target_season_id: seasonId,
          target_team_id: teamId,
          target_player_id: member.id,
          active: true,
          change_reason: 'demo seed roster',
        });
        console.log(`  roster ok: ${member.name} → ${name}`);
      } catch (error) {
        console.error(`  roster skip: ${member.name} → ${name} — ${error.message}`);
      }
    }

    try {
      await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_assign_team_captain', {
        actor_user_id: ctx.actorUserId,
        target_season_id: seasonId,
        target_team_id: teamId,
        target_player_id: captain.id,
      });
      console.log(`  captain ok: ${captain.name} → ${name}`);
    } catch (error) {
      console.error(`  captain skip: ${captain.name} → ${name} — ${error.message}`);
    }

    if (edge !== 'no-messages' && messages?.length && captain.id) {
      const body = messages[createdTeams.length % messages.length];
      try {
        await rpc(ctx.baseUrl, ctx.serviceKey, 'admin_seed_team_chat_message', {
          actor_user_id: ctx.actorUserId,
          target_team_id: teamId,
          author_player_id: captain.id,
          message_body: body,
        });
        console.log(`  message ok: ${name}`);
      } catch (error) {
        console.error(`  message skip: ${name} — ${error.message}`);
      }
    }

    createdTeams.push({
      name,
      id: teamId,
      edge,
      captainId: captain.id,
      members,
    });
  }

  const leftover = pool.slice(poolIndex);
  if (leftover.length) {
    console.log(`  free agents left unassigned: ${leftover.map((p) => p.name).join(', ')}`);
  }

  return createdTeams;
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
  const today = new Date().toISOString().slice(0, 10);
  const past = rounds.filter((r) => r.scheduledOn < today).length;
  const future = rounds.filter((r) => r.scheduledOn >= today).length;
  console.log(`  calendar split: ${past} rounds dated past / ${future} on or after today (half-season feel)`);
  return row;
}

async function main() {
  const apply = process.env.SEED_APPLY === '1';
  const scenario = (process.env.SEED_SCENARIO || 'all').toLowerCase();
  const dataPath = process.env.SEED_DATA_PATH
    ? path.resolve(process.env.SEED_DATA_PATH)
    : path.join(root, 'config/demo-league-seed.json');
  const data = JSON.parse(await readFile(dataPath, 'utf8'));

  console.log(`Seed file: ${dataPath}`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN (set SEED_APPLY=1 to mutate)'}`);
  console.log(`Players: ${(data.players || []).length}`);
  console.log(`Teams: ${(data.teams || []).length}`);

  if (!apply) {
    console.log('\nPlanned coverage:');
    console.log('  - Unclaimed players with mixed phones / no-phone free agent');
    console.log('  - Edge names: short, long, similar');
    console.log('  - Eight teams with captains + varied roster sizes (2–5)');
    console.log('  - Team chat messages (except no-messages team)');
    console.log('  - Registration season and/or mid-season active schedule (past + future rounds)');
    console.log('  - NOT scored/finalized match results or prize dollars');
    console.log('\nNo database writes performed.');
    return;
  }

  const ctx = {
    baseUrl: required('SUPABASE_URL').replace(/\/$/, ''),
    serviceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    actorUserId: required('SEED_ACTOR_USER_ID'),
  };

  console.log('\nPhase: players + phones');
  const players = await createPlayers(ctx, data.players || []);

  const runSeason = async (label, seasonConfig, publish) => {
    console.log(`\nPhase: ${label}`);
    const seasonInfo = await configureSeason(
      ctx,
      seasonConfig,
      process.env.SEED_SEASON_ID || null,
    );
    const teams = await createTeamsWithCaptainsAndRosters(
      ctx,
      seasonInfo.id,
      data.teams || [],
      players,
      data.messages || [],
    );
    const ids = teams.map((t) => t.id).filter(Boolean);
    if (publish) {
      if (ids.length !== 8) {
        console.error(`  cannot publish: need 8 teams, have ${ids.length}`);
      } else {
        const rounds = buildRoundsPayload(
          ids,
          seasonConfig.firstRoundDate,
          seasonConfig.roundIntervalDays,
          seasonConfig.tableNumbers,
        );
        await publishSchedule(
          ctx,
          seasonInfo.id,
          seasonInfo.status || 'registration',
          rounds,
        );
      }
    }
    return { seasonInfo, teams };
  };

  if (scenario === 'registration') {
    await runSeason('registration season', data.scenarios.registration.season, false);
  } else if (scenario === 'active') {
    await runSeason('mid-season active', data.scenarios.activeHalf.season, true);
  } else if (scenario === 'all') {
    await runSeason('mid-season active', data.scenarios.activeHalf.season, true);
    // second season may fail if only one registration allowed — best effort
    try {
      process.env.SEED_SEASON_ID = '';
      await runSeason('registration season', data.scenarios.registration.season, false);
    } catch (error) {
      console.error(`  registration season skipped: ${error.message}`);
    }
  }

  console.log('\nDone.');
  console.log('Remaining for true end-to-end nights: dual rack scoring + finalize + prize config.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
