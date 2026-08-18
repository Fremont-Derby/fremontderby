function requireValue(value, message) {
  if (value == null || value === '') throw new Error(message);
  return value;
}

function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`repository must implement ${method}`);
  }
}

export async function listMyNotificationsCommand({ actorUserId, limit }, repository) {
  assertRepository(repository, 'listMyNotifications');
  return repository.listMyNotifications({
    actorUserId: requireValue(actorUserId, 'actorUserId is required'),
    limit: limit ?? 50,
  });
}

export async function markNotificationReadCommand({ actorUserId, notificationId }, repository) {
  assertRepository(repository, 'markNotificationRead');
  return repository.markNotificationRead({
    actorUserId: requireValue(actorUserId, 'actorUserId is required'),
    notificationId: requireValue(notificationId, 'notificationId is required'),
  });
}

export async function markAllNotificationsReadCommand({ actorUserId }, repository) {
  assertRepository(repository, 'markAllNotificationsRead');
  return repository.markAllNotificationsRead({
    actorUserId: requireValue(actorUserId, 'actorUserId is required'),
  });
}

export async function adminBroadcastNotificationCommand(
  { actorUserId, title, body, seasonId, href },
  repository,
) {
  assertRepository(repository, 'adminBroadcastNotification');
  const cleanedTitle = String(requireValue(title, 'title is required')).trim();
  const cleanedBody = String(requireValue(body, 'body is required')).trim();
  if (cleanedTitle.length > 120) throw new Error('title must be 120 characters or fewer');
  if (cleanedBody.length > 500) throw new Error('body must be 500 characters or fewer');
  return repository.adminBroadcastNotification({
    actorUserId: requireValue(actorUserId, 'actorUserId is required'),
    title: cleanedTitle,
    body: cleanedBody,
    seasonId: seasonId || null,
    href: href ? String(href).trim() : null,
  });
}

export async function createUserNotificationCommand(payload, repository) {
  assertRepository(repository, 'createUserNotification');
  return repository.createUserNotification(payload);
}
