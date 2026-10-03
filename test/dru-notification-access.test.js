import test from 'node:test';
import assert from 'node:assert/strict';
import { browserCanReadNotifications, notificationAccessContract, assertWorkerNotificationUrl, notificationRpcName } from '../src/druNotificationAccess.js';

test('a browser role cannot read DRU notifications', () => {
  const contract = notificationAccessContract();
  assert.equal(contract.rls, true);
  assert.equal(contract.workerRole, 'service_role');
  assert.equal(browserCanReadNotifications([{ role: 'anon', privilege: 'SELECT' }]), true);
  assert.equal(browserCanReadNotifications([{ role: 'service_role', privilege: 'SELECT' }]), false);
  assert.equal(browserCanReadNotifications([]), false);
});

test('a direct notification table read is rejected', () => {
  assert.equal(assertWorkerNotificationUrl, notificationRpcName('/rest/v1/rpc/list_my_notifications'), '/rest/v1/rpc/list_my_notifications');
  assert.throws(() => assertWorkerNotificationUrl, notificationRpcName('/rest/v1/user_notifications'), /Worker RPC/);
});

test('a notification call names a Worker RPC', () => {
  assert.equal(notificationRpcName('/rest/v1/rpc/list_my_notifications'), 'list_my_notifications');
  assert.throws(() => notificationRpcName('/rest/v1/user_notifications'), /Worker RPC/);
});
