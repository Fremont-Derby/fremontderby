import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  respondToTeamTradePlayerCommand,
  approveTeamTradeCaptainCommand,
} from '../src/teamCommands.js';

test('player trade response accepts verb form accept', async () => {
  const repo = {
    async respondToTeamTradePlayer({ response }) {
      return { response };
    },
  };
  const trade = await respondToTeamTradePlayerCommand(
    { actorUserId: 'u', tradeId: 't', response: 'accept' },
    repo,
  );
  assert.equal(trade.response, 'accepted');
});

test('captain trade response accepts verb form approve', async () => {
  const repo = {
    async approveTeamTradeCaptain({ response }) {
      return { response };
    },
  };
  const trade = await approveTeamTradeCaptainCommand(
    { actorUserId: 'u', tradeId: 't', response: 'approve' },
    repo,
  );
  assert.equal(trade.response, 'approved');
});

test('index maps accept/approve verbs in normalizeApproveDecline', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(src, /value === 'accept'/);
  assert.match(src, /value === 'approve'/);
});
