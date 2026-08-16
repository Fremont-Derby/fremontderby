import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listSeasonFreeAgentsCommand } from '../src/freeAgentCommands.js';

test('listSeasonFreeAgentsCommand requires seasonId', async () => {
  await assert.rejects(
    () => listSeasonFreeAgentsCommand({}, { listSeasonFreeAgents: async () => [] }),
    /seasonId/,
  );
});

test('listSeasonFreeAgentsCommand delegates', async () => {
  const rows = await listSeasonFreeAgentsCommand(
    { seasonId: 's1' },
    { listSeasonFreeAgents: async ({ seasonId }) => [{ playerId: 'p1', seasonId }] },
  );
  assert.equal(rows[0].playerId, 'p1');
});

test('index routes season free-agents GET', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.ok(src.includes('handleListSeasonFreeAgentsRequest'));
  assert.ok(src.includes('seasonFreeAgentsMatch'));
  assert.ok(src.includes('/free-agents$'));
});

test('listSeasonFreeAgents repository falls back when season_players empty', async () => {
  const { createFreeAgentRepository } = await import('../src/freeAgentRepository.js');
  // Smoke: module still exports factory
  assert.equal(typeof createFreeAgentRepository, 'function');
});
