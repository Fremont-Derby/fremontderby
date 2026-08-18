/**
 * Pure deploy-identity resolution for /health versionTag.
 * Priority: CF metadata tag → DEPLOY_GIT_SHA var → stamped bundle constant → CF version id.
 */
export function resolveVersionTag({
  meta = {},
  deployGitSha = null,
  stampedSha = null,
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

  const versionTag = fromMeta || fromEnv || fromStamp || fromId || null;

  let versionTagSource = null;
  if (versionTag && fromMeta === versionTag) versionTagSource = 'cf_metadata';
  else if (versionTag && fromEnv === versionTag) versionTagSource = 'DEPLOY_GIT_SHA';
  else if (versionTag && fromStamp === versionTag) versionTagSource = 'stamped_source';
  else if (versionTag && fromId === versionTag) versionTagSource = 'cf_version_id';

  return { versionTag, versionTagSource };
}
