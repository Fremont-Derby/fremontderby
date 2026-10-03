export const DRU_NOTIFICATION_TABLE = 'dru.user_notifications';

export const DRU_NOTIFICATION_BROWSER_ROLES = ['public', 'anon', 'authenticated'];

export function notificationAccessContract() {
  return {
    table: DRU_NOTIFICATION_TABLE,
    rls: true,
    browserRoles: DRU_NOTIFICATION_BROWSER_ROLES,
    workerRole: 'service_role',
    workerPrivileges: ['select', 'insert', 'update'],
  };
}

export function browserCanReadNotifications(grants) {
  const allowed = new Set(DRU_NOTIFICATION_BROWSER_ROLES);
  return (grants || []).some((grant) => allowed.has(grant.role) && String(grant.privilege || '').toUpperCase() === 'SELECT');
}

export function assertWorkerNotificationUrl(url) {
  const value = String(url || '');
  if (value.includes('/rest/v1/user_notifications')) {
    throw new Error('DRU notifications are read through the Worker RPC, not the table.');
  }
  return value;
}

export function notificationRpcName(url) {
  const value = assertWorkerNotificationUrl(url);
  const match = value.match(/\/rpc\/([a-z0-9_]+)/i);
  if (!match) throw new Error('DRU notifications require a Worker RPC name.');
  return match[1];
}
