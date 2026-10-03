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

export const ALLOWED_NOTIFICATION_RPCS = [
  'list_my_notifications',
  'mark_my_notification_read',
  'mark_all_my_notifications_read',
  'admin_broadcast_notification',
  'create_user_notification',
];

export function assertAllowedNotificationRpc(url) {
  const name = notificationRpcName(url);
  if (!ALLOWED_NOTIFICATION_RPCS.includes(name)) {
    throw new Error('DRU notifications do not allow that RPC.');
  }
  return name;
}
