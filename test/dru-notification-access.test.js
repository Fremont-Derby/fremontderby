import test from 'node:test';
import assert from 'node:assert/strict';
import { browserCanReadNotifications, notificationAccessContract } from '../src/druNotificationAccess.js';

test('a browser role cannot read DRU notifications', () => {
  const contract = notificationAccessContract();
  assert.equal(contract.rls, true);
  assert.equal(contract.workerRole, 'service_role');
  assert.equal(browserCanReadNotifications([{ role: 'anon', privilege: 'SELECT' }]), true);
  assert.equal(browserCanReadNotifications([{ role: 'service_role', privilege: 'SELECT' }]), false);
  assert.equal(browserCanReadNotifications([]), false);
});
