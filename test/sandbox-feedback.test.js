import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  listSandboxFeedbackCommand,
  resolveSandboxFeedbackCommand,
  submitSandboxFeedbackCommand,
} from '../src/sandboxFeedbackCommands.js';
import { createSandboxFeedbackRepository } from '../src/sandboxFeedbackRepository.js';

const migrationUrl = new URL(
  '../supabase/migrations/20260811075500_sandbox_feedback.sql',
  import.meta.url,
);

function repositoryDouble() {
  const calls = [];
  return {
    calls,
    async submitSandboxFeedback(payload) {
      calls.push(['submit', payload]);
      return { id: 'feedback-1', status: 'open' };
    },
    async listSandboxFeedback(payload) {
      calls.push(['list', payload]);
      return [{ id: 'feedback-1', status: 'open' }];
    },
    async resolveSandboxFeedback(payload) {
      calls.push(['resolve', payload]);
      return { id: payload.feedbackId, status: 'reviewed' };
    },
  };
}

test('sandbox feedback commands normalize context and keep admin review explicit', async () => {
  const repository = repositoryDouble();
  assert.deepEqual(await submitSandboxFeedbackCommand({
    actorUserId: 'user-1',
    surface: 'player',
    path: ' /sandbox/player ',
    context: { phase: 'mismatch', mismatchRack: 3 },
    comment: '  Rack three was confusing.  ',
  }, repository), { id: 'feedback-1', status: 'open' });

  await listSandboxFeedbackCommand({ actorUserId: 'admin-1', status: 'open', limit: 50 }, repository);
  await resolveSandboxFeedbackCommand({ actorUserId: 'admin-1', feedbackId: 'feedback-1' }, repository);

  assert.deepEqual(repository.calls, [
    ['submit', {
      actorUserId: 'user-1',
      surface: 'player',
      path: '/sandbox/player',
      context: { phase: 'mismatch', mismatchRack: 3 },
      comment: 'Rack three was confusing.',
    }],
    ['list', { actorUserId: 'admin-1', status: 'open', limit: 50 }],
    ['resolve', { actorUserId: 'admin-1', feedbackId: 'feedback-1' }],
  ]);
});

test('sandbox feedback command rejects secret-shaped or oversized caller payloads by contract size/type', async () => {
  const repository = repositoryDouble();
  await assert.rejects(
    submitSandboxFeedbackCommand({ actorUserId: 'user-1', surface: 'player', path: '/sandbox/player', context: [], comment: 'hi' }, repository),
    /context must be an object/,
  );
  await assert.rejects(
    submitSandboxFeedbackCommand({ actorUserId: 'user-1', surface: 'unknown', path: '/sandbox/player', context: {}, comment: 'hi' }, repository),
    /surface must be/,
  );
  await assert.rejects(
    submitSandboxFeedbackCommand({ actorUserId: 'user-1', surface: 'player', path: '/sandbox/player', context: {}, comment: 'x'.repeat(2001) }, repository),
    /2000 characters/,
  );
  assert.deepEqual(repository.calls, []);
});

test('sandbox feedback repository uses only trusted service-role RPCs', async () => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify([{ id: 'feedback-1', status: 'open' }]), { status: 200 });
  };
  const repository = createSandboxFeedbackRepository({
    SUPABASE_URL: 'https://project.supabase.co/',
    SUPABASE_SERVICE_ROLE_KEY: 'service-secret',
  }, { fetch });

  await repository.submitSandboxFeedback({
    actorUserId: 'user-1', surface: 'captain', path: '/sandbox/captain', context: { phase: 'lineup' }, comment: 'Good flow',
  });
  await repository.listSandboxFeedback({ actorUserId: 'admin-1', status: 'all', limit: 100 });
  await repository.resolveSandboxFeedback({ actorUserId: 'admin-1', feedbackId: 'feedback-1' });

  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /rpc\/submit_sandbox_feedback$/);
  assert.match(calls[1].url, /rpc\/list_sandbox_feedback$/);
  assert.match(calls[2].url, /rpc\/resolve_sandbox_feedback$/);
  assert.equal(calls.every(({ init }) => init.headers.apikey === 'service-secret'), true);
  assert.equal(calls.every(({ init }) => init.headers.authorization === 'Bearer service-secret'), true);
  assert.equal(JSON.parse(calls[1].init.body).status_filter, null);
});

test('sandbox feedback migration is isolated from competitive records and browser roles', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create table if not exists private\.sandbox_feedback/i);
  assert.match(sql, /alter table private\.sandbox_feedback enable row level security/i);
  assert.match(sql, /revoke all on private\.sandbox_feedback from public, anon, authenticated/i);
  assert.match(sql, /submit_sandbox_feedback/i);
  assert.match(sql, /list_sandbox_feedback/i);
  assert.match(sql, /resolve_sandbox_feedback/i);
  assert.match(sql, /private\.league_admins/i);
  assert.match(sql, /grant execute[\s\S]*to service_role/i);
  assert.match(sql, /revoke all on function[\s\S]*anon, authenticated/i);
  assert.doesNotMatch(sql, /player_matches|player_match_racks|team_standings|individual_standings|prize|payment/i);
});
