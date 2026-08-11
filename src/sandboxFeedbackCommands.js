function assertRepository(repository, method) {
  if (!repository || typeof repository[method] !== 'function') {
    throw new Error(`sandbox feedback repository must implement ${method}`);
  }
}

function assertActor(actorUserId) {
  if (!actorUserId) throw new Error('actorUserId is required');
}

function normalizeSurface(value) {
  if (!['demo', 'player', 'captain'].includes(value)) {
    throw new Error('surface must be demo, player, or captain');
  }
  return value;
}

function normalizePath(value) {
  const path = typeof value === 'string' ? value.trim() : '';
  if (!path || path.length > 160) throw new Error('path is required and must be 160 characters or fewer');
  return path;
}

function normalizeComment(value) {
  const comment = typeof value === 'string' ? value.trim() : '';
  if (!comment || comment.length > 2000) {
    throw new Error('comment is required and must be 2000 characters or fewer');
  }
  return comment;
}

function normalizeContext(value) {
  if (value == null) return {};
  if (Array.isArray(value) || typeof value !== 'object') throw new Error('context must be an object');
  return value;
}

export async function submitSandboxFeedbackCommand(
  { actorUserId, surface, path, context, comment },
  repository,
) {
  assertActor(actorUserId);
  assertRepository(repository, 'submitSandboxFeedback');
  return repository.submitSandboxFeedback({
    actorUserId,
    surface: normalizeSurface(surface),
    path: normalizePath(path),
    context: normalizeContext(context),
    comment: normalizeComment(comment),
  });
}

export async function listSandboxFeedbackCommand(
  { actorUserId, status = 'open', limit = 100 },
  repository,
) {
  assertActor(actorUserId);
  if (!['open', 'reviewed', 'all'].includes(status)) {
    throw new Error('status must be open, reviewed, or all');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
    throw new Error('limit must be an integer from 1 to 250');
  }
  assertRepository(repository, 'listSandboxFeedback');
  return repository.listSandboxFeedback({ actorUserId, status, limit });
}

export async function resolveSandboxFeedbackCommand(
  { actorUserId, feedbackId },
  repository,
) {
  assertActor(actorUserId);
  if (!feedbackId) throw new Error('feedbackId is required');
  assertRepository(repository, 'resolveSandboxFeedback');
  return repository.resolveSandboxFeedback({ actorUserId, feedbackId });
}
