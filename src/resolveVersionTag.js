/**
 * Resolve Worker deploy identity for /health canaries.
 * Priority (first non-empty wins):
 *   1. CF_VERSION_METADATA.tag  (wrangler --tag)
 *   2. DEPLOY_GIT_SHA           (wrangler --var)
 *   3. stamped source constant  (scripts/stamp-deploy-identity.mjs)
 *   4. CF_VERSION_METADATA.id   (Cloudflare version id; never "local")
 */
export function resolveVersionTag({
  meta = {},
  deployGitSha = null,
  stampedSha = null,
  stampedAt = null,
} = {}) {
  const fromMeta =
    typeof meta.tag === 'string' && meta.tag.trim() ? meta.tag.trim() : null;
  const fromEnv =
    typeof deployGitSha === 'string' && deployGitSha.trim() ? deployGitSha.trim() : null;
  const fromStamp =
    typeof stampedSha === 'string' && stampedSha.trim() ? stampedSha.trim() : null;
  const fromId =
    typeof meta.id === 'string' && meta.id.trim() && meta.id !== 'local'
      ? meta.id.trim()
      : null;

  const tag = fromMeta || fromEnv || fromStamp || fromId || null;
  let versionTagSource = null;
  if (tag && fromMeta === tag) versionTagSource = 'cf_metadata';
  else if (tag && fromEnv === tag) versionTagSource = 'DEPLOY_GIT_SHA';
  else if (tag && fromStamp === tag) versionTagSource = 'stamped_source';
  else if (tag && fromId === tag) versionTagSource = 'cf_version_id';

  const deployedAt =
    (typeof meta.timestamp === 'string' && meta.timestamp.trim()
      ? meta.timestamp.trim()
      : null) ||
    (typeof stampedAt === 'string' && stampedAt.trim() ? stampedAt.trim() : null) ||
    null;

  return {
    versionTag: tag,
    versionTagSource,
    deployedAt,
    version: (typeof meta.id === 'string' && meta.id.trim() ? meta.id.trim() : null) || 'local',
  };
}
