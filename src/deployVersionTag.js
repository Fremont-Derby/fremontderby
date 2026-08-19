/**
 * Pure deploy identity resolution for /health canaries.
 * Prefer CF metadata.tag, then env var, then source stamp, then CF version id.
 */

function trimNonEmpty(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * @param {{ meta?: { tag?: string, id?: string, timestamp?: string }, deployGitSha?: string, stampedSha?: string|null, stampedAt?: string|null }} input
 * @returns {{ tag: string|null, versionTagSource: string|null, deployedAt: string|null, version: string }}
 */
export function resolveDeployVersionTag({
  meta = {},
  deployGitSha,
  stampedSha,
  stampedAt,
} = {}) {
  const fromMeta = trimNonEmpty(meta?.tag);
  const fromEnv = trimNonEmpty(deployGitSha);
  const fromStamp = trimNonEmpty(stampedSha);
  const rawId = trimNonEmpty(meta?.id);
  const fromId = rawId && rawId !== 'local' ? rawId : null;

  const tag = fromMeta || fromEnv || fromStamp || fromId || null;

  let versionTagSource = null;
  if (tag && fromMeta === tag) versionTagSource = 'cf_metadata';
  else if (tag && fromEnv === tag) versionTagSource = 'DEPLOY_GIT_SHA';
  else if (tag && fromStamp === tag) versionTagSource = 'stamped_source';
  else if (tag && fromId === tag) versionTagSource = 'cf_version_id';

  const deployedAt = trimNonEmpty(meta?.timestamp) || trimNonEmpty(stampedAt) || null;
  const version = trimNonEmpty(meta?.id) || 'local';

  return { tag, versionTagSource, deployedAt, version };
}
