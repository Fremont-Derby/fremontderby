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
