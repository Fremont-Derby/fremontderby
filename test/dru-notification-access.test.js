import test from 'node:test';
import assert from 'node:assert/strict';
import { browserCanReadNotifications, notificationAccessContract, assertWorkerNotificationUrl, notificationRpcName, assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant } from '../src/druNotificationAccess.js';

test('a browser role cannot read DRU notifications', () => {
  const contract = notificationAccessContract();
  assert.equal(contract.rls, true);
  assert.equal(contract.workerRole, 'service_role');
  assert.equal(browserCanReadNotifications([{ role: 'anon', privilege: 'SELECT' }]), true);
  assert.equal(browserCanReadNotifications([{ role: 'service_role', privilege: 'SELECT' }]), false);
  assert.equal(browserCanReadNotifications([]), false);
});

test('a direct notification table read is rejected', () => {
  assert.equal(assertWorkerNotificationUrl, notificationRpcName, assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/rpc/list_my_notifications'), '/rest/v1/rpc/list_my_notifications');
  assert.throws(() => assertWorkerNotificationUrl, notificationRpcName, assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/user_notifications'), /Worker RPC/);
});

test('a notification call names a Worker RPC', () => {
  assert.equal(notificationRpcName, assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => notificationRpcName, assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/user_notifications'), /Worker RPC/);
});

test('only the known notification RPCs are allowed', () => {
  assert.equal(assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => assertAllowedNotificationRpc, assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/rpc/read_all_notifications'), /do not allow/);
});

test('a notification table dump is rejected', () => {
  assert.equal(assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => assertNoNotificationDump, assertNoBrowserNotificationGrant('/rest/v1/rpc/list_my_notifications?select=*'), /table dump/);
});

test('a browser notification grant is rejected', () => {
  assert.equal(assertNoBrowserNotificationGrant('revoke all on table dru.user_notifications from anon'), 'revoke all on table dru.user_notifications from anon');
  assert.throws(() => assertNoBrowserNotificationGrant('grant select on table dru.user_notifications to anon'), /browser read/);
});
