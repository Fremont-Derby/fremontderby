import { fileURLToPath } from 'node:url';

/**
 * Fail-closed release source policy (#889).
 * - base main → head must be fremontderby-gamma
 * - base fremontderby-gamma → head must be jfl/* or dru/* (or fremontderby-jfl / fremontderby-dru)
 * Safe for public repos: no deployment secrets.
 */

export function normalizeBranch(ref) {
  return String(ref || '').replace(/^refs\/heads\//, '').trim();
}

export function evaluateReleaseSourcePolicy({ base, head, isFork = false }) {
  const baseBranch = normalizeBranch(base);
  const headBranch = normalizeBranch(head);
  const errors = [];

  if (!baseBranch) errors.push('Missing base branch.');
  if (!headBranch) errors.push('Missing head branch.');
  if (errors.length) return { ok: false, errors };

  if (baseBranch === 'main') {
    if (headBranch !== 'fremontderby-gamma') {
      errors.push(
        `PRs into main must come from fremontderby-gamma (got "${headBranch}").`,
      );
    }
    if (isFork) {
      errors.push('Fork PRs cannot merge directly into main.');
    }
  } else if (baseBranch === 'fremontderby-gamma') {
    const trusted =
      /^jfl\//.test(headBranch) ||
      /^dru\//.test(headBranch) ||
      headBranch === 'fremontderby-jfl' ||
      headBranch === 'fremontderby-dru';
    if (!trusted) {
      errors.push(
        `PRs into fremontderby-gamma must come from jfl/* or dru/* (got "${headBranch}").`,
      );
    }
    if (isFork) {
      errors.push('Fork PRs cannot claim JFL/DRU promotion into fremontderby-gamma.');
    }
  }

  return { ok: errors.length === 0, errors, baseBranch, headBranch };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = process.env.GITHUB_BASE_REF || process.argv[2];
  const head = process.env.GITHUB_HEAD_REF || process.argv[3];
  const isFork = String(process.env.PR_IS_FORK || 'false') === 'true';
  const result = evaluateReleaseSourcePolicy({ base, head, isFork });
  if (!result.ok) {
    for (const e of result.errors) console.error(e);
    process.exitCode = 1;
  } else {
    console.log(`Release source policy OK: ${result.headBranch} → ${result.baseBranch}`);
  }
}
