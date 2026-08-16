import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { writeAuditBestEffort, deliverAuditWebhooks } from '../src/adminAuditRepository.js';

test('index wires audit on dispute and invitations', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  for (const action of [
    'team_match.dispute',
    'team_invitation.create',
    'team_invitation.accept',
    'team_invitation.cancel',
    'team_trade.propose',
    'team_match.makeup_propose',
    'team_match.makeup_respond',
  ]) {
    assert.match(src, new RegExp(action.replace('.', '\\.')));
  }
});

test('writeAuditBestEffort skips missing entityId', async () => {
  const result = await writeAuditBestEffort({}, 'actor', { action: 'x', entityType: 'y' });
  assert.equal(result.ok, false);
});

test('deliver without webhook URL drains batch', async () => {
  const marked = [];
  const result = await deliverAuditWebhooks({}, 'actor', {
    repository: {
      async claimWebhookBatch() {
        return [{ outboxId: 'o1', payload: {} }];
      },
      async markWebhookDelivered(args) {
        marked.push(args);
      },
    },
  });
  assert.equal(result.skipped, true);
  assert.equal(result.drained, 1);
  assert.equal(marked[0].error, 'AUDIT_WEBHOOK_URL not configured');
});

test('admin audit page has action prefix chips', () => {
  const src = readFileSync(new URL('../src/adminAuditPage.js', import.meta.url), 'utf8');
  assert.match(src, /data-prefix-chip/);
  assert.match(src, /team_invitation\./);
});
