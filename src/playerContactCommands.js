function requireRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`player contact repository must implement ${method}`);
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new Error('actorUserId is required');
}

function normalizePhone(value) {
  if (value == null) return null;
  if (typeof value !== 'string') throw new Error('phone must be text');
  const phone = value.trim();
  if (!phone) return null;
  const digitCount = phone.replace(/\D/g, '').length;
  if (digitCount < 10 || digitCount > 15) {
    throw new Error('Phone number must contain between 10 and 15 digits');
  }
  return phone;
}

export function getOwnPlayerContactCommand({ actorUserId }, repository) {
  requireActor(actorUserId);
  requireRepository(repository, 'getOwn');
  return repository.getOwn({ actorUserId });
}

export function setOwnPlayerContactCommand({ actorUserId, phone }, repository) {
  requireActor(actorUserId);
  requireRepository(repository, 'setOwn');
  return repository.setOwn({ actorUserId, phone: normalizePhone(phone) });
}

export function getAdminPlayerContactCommand({ actorUserId, playerId }, repository) {
  requireActor(actorUserId);
  if (!playerId) throw new Error('playerId is required');
  requireRepository(repository, 'getAdminPlayer');
  return repository.getAdminPlayer({ actorUserId, playerId });
}
