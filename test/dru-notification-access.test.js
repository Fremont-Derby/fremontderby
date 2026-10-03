import test from 'node:test';
import assert from 'node:assert/strict';
import {
  browserCanReadNotifications,
  notificationAccessContract,
  assertWorkerNotificationUrl,
  notificationRpcName,
  assertAllowedNotificationRpc,
  assertNoNotificationDump,
  assertNoBrowserNotificationGrant,
  assertNotificationRevoke,
  assertNotificationRls,
  assertNotificationWorkerGrant,
} from '../src/druNotificationAccess.js';

test('a browser role cannot read DRU notifications', () => {
  const contract = notificationAccessContract();
  assert.equal(contract.rls, true);
  assert.equal(contract.workerRole, 'service_role');
  assert.equal(browserCanReadNotifications([{ role: 'anon', privilege: 'SELECT' }]), true);
  assert.equal(browserCanReadNotifications([{ role: 'service_role', privilege: 'SELECT' }]), false);
});

test('a direct notification table read is rejected', () => {
  assert.equal(assertWorkerNotificationUrl('/rest/v1/rpc/list_my_notifications'), '/rest/v1/rpc/list_my_notifications');
  assert.throws(() => assertWorkerNotificationUrl('/rest/v1/user_notifications'), /Worker RPC/);
});

test('a notification call names a Worker RPC', () => {
  assert.equal(notificationRpcName('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => notificationRpcName('/rest/v1/user_notifications'), /Worker RPC/);
});

test('only the known notification RPCs are allowed', () => {
  assert.equal(assertAllowedNotificationRpc('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => assertAllowedNotificationRpc('/rest/v1/rpc/read_all_notifications'), /do not allow/);
});

test('a notification table dump is rejected', () => {
  assert.equal(assertNoNotificationDump('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => assertNoNotificationDump('/rest/v1/rpc/list_my_notifications?select=*'), /table dump/);
});

test('a browser notification grant is rejected', () => {
  assert.equal(assertNoBrowserNotificationGrant('revoke all on table dru.user_notifications from anon'), 'revoke all on table dru.user_notifications from anon');
  assert.throws(() => assertNoBrowserNotificationGrant('grant select on table dru.user_notifications to anon'), /browser read/);
});

test('a notification migration must revoke the browser grant', () => {
  assert.match(assertNotificationRevoke('revoke all on table dru.user_notifications from public, anon, authenticated'), /revoke all/);
  assert.throws(() => assertNotificationRevoke("comment on table dru.user_notifications is 'open'"), /must revoke/);
});

test('a notification migration must enable row security', () => {
  const sql = 'alter table dru.user_notifications enable row level security; revoke all on table dru.user_notifications from public, anon, authenticated';
  assert.match(assertNotificationRls(sql), /row level security/);
  assert.throws(() => assertNotificationRls('revoke all on table dru.user_notifications from public, anon, authenticated'), /row security/);
});

test('a notification migration must keep the Worker grant', () => {
  const sql = 'alter table dru.user_notifications enable row level security; revoke all on table dru.user_notifications from public, anon, authenticated; grant select, insert, update on table dru.user_notifications to service_role';
  assert.match(assertNotificationWorkerGrant(sql), /service_role/);
  assert.throws(() => assertNotificationWorkerGrant('alter table dru.user_notifications enable row level security; revoke all on table dru.user_notifications from public, anon, authenticated'), /Worker grant/);
});
