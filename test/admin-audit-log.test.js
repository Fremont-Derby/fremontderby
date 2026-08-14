import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createAdminAuditRepository } from '../src/adminAuditRepository.js';
import { renderAdminAuditPage } from '../src/adminAuditPage.js';

test('admin audit page renders feed UI', () => {
  const html = renderAdminAuditPage();
  assert.match(html, /Admin audit log/);
  assert.match(html, /\/api\/admin\/audit-events/);
  assert.match(html, /Flush webhooks/);
});

test('repository maps list rows', async () => {
  const repository = createAdminAuditRepository(
    { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'key' },
    {
      fetch: async () =>
        new Response(
          JSON.stringify([
            {
              id: 'e1',
              actor_user_id: 'u1',
              actor_display_name: 'Admin',
              action: 'player.admin_add_team_membership',
              entity_type: 'player',
              entity_id: 'p1',
              reason: 'roster fix',
              before_state: null,
              after_state: { teamId: 't1' },
              created_at: '2026-08-14T00:00:00Z',
            },
          ]),
          { status: 200 },
        ),
    },
  );
  const events = await repository.listAuditEvents({ actorUserId: 'u1' });
  assert.equal(events[0].actorDisplayName, 'Admin');
  assert.equal(events[0].action, 'player.admin_add_team_membership');
});

test('migration and wiring present', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260814170000_admin_audit_log_and_moderation.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /list_admin_audit_events/);
  assert.match(sql, /audit_webhook_outbox/);
  assert.match(sql, /write_admin_audit_event/);
  const index = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(index, /\/api\/admin\/audit-events/);
  assert.match(index, /admin\.broadcast_notification/);
  const chat = readFileSync(new URL('../src/chatHttp.js', import.meta.url), 'utf8');
  assert.match(chat, /chat\.moderate/);
});
