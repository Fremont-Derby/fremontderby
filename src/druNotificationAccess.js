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

export function assertNoNotificationDump(url) {
  const value = assertAllowedNotificationRpc(url);
  if (String(url || '').includes('select=*')) {
    throw new Error('DRU notifications do not allow a table dump.');
  }
  return value;
}

export function assertNoBrowserNotificationGrant(sql) {
  const value = String(sql || '');
  if (/grant\s+select[\s\S]*user_notifications[\s\S]*\b(anon|authenticated)\b/i.test(value)) {
    throw new Error('DRU notifications cannot grant a browser read.');
  }
  return value;
}

export function assertNotificationRevoke(sql) {
  const value = assertNoBrowserNotificationGrant(sql);
  if (value.includes('user_notifications') && !/revoke all on table dru\.user_notifications from public, anon, authenticated/i.test(value)) {
    throw new Error('DRU notifications must revoke the browser grant.');
  }
  return value;
}

export function assertNotificationRls(sql) {
  const value = assertNotificationRevoke(sql);
  if (value.includes('user_notifications') && !/enable row level security/i.test(value)) {
    throw new Error('DRU notifications must enable row security.');
  }
  return value;
}

export function assertNotificationWorkerGrant(sql) {
  const value = assertNotificationRls(sql);
  if (value.includes('user_notifications') && !/grant select, insert, update on table dru\.user_notifications to service_role/i.test(value)) {
    throw new Error('DRU notifications must grant the Worker role.');
  }
  return value;
}
