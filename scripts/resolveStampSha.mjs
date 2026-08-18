import { spawnSync } from 'node:child_process';

const SHA_RE = /^[0-9a-f]{7,40}$/i;

/**
 * Resolve deploy identity SHA for stamp-deploy-identity.
 * Priority: GITHUB_SHA → WORKERS_CI_COMMIT_SHA → DEPLOY_GIT_SHA → git HEAD.
 */
export function resolveStampSha(env = process.env, gitRevParse = defaultGitRevParse) {
  const candidates = [env.GITHUB_SHA, env.WORKERS_CI_COMMIT_SHA, env.DEPLOY_GIT_SHA];
  for (const raw of candidates) {
    const sha = String(raw || '').trim();
    if (SHA_RE.test(sha)) return sha;
  }
  const fromGit = String(gitRevParse() || '').trim();
  if (SHA_RE.test(fromGit)) return fromGit;
  return '';
}

function defaultGitRevParse() {
  const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (git.status !== 0) return '';
  return String(git.stdout || '').trim();
}
