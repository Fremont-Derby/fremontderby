import { fileURLToPath } from 'node:url';

/**
 * Release source policy (#889, #3274).
 *
 * Promotion topology:
 * - main <- fremontderby-gamma only
 * - fremontderby-gamma <- JFL only
 * - DRU is never a Gamma or production promotion source.
 *
 * DRU remains autonomous on fremontderby-dru and may open handoffs toward JFL;
 * this policy only governs release targets.
 *
 * No deployment secrets. Fail closed on forks for promotion branches.
 */

export function normalizeBranch(ref) {
  return String(ref || '').replace(/^refs\/heads\//, '').trim();
}

function isDruSource(branch) {
  return branch === 'fremontderby-dru' || /^dru\//.test(branch);
}

export function evaluateReleaseSourcePolicy({
  base,
  head,
  isFork = false,
  strict = false,
}) {
  const baseBranch = normalizeBranch(base);
  const headBranch = normalizeBranch(head);
  const errors = [];
  const notices = [];

  if (!baseBranch) errors.push('Missing base branch.');
  if (!headBranch) errors.push('Missing head branch.');
  if (errors.length) return { ok: false, errors, notices };

  if ((baseBranch === 'main' || baseBranch === 'fremontderby-gamma') && isDruSource(headBranch)) {
    errors.push(
      `DRU is not an authorized release source for ${baseBranch}. Hand portable findings to JFL; Gamma/production promotion follows the JFL release path.`,
    );
  }

  if (baseBranch === 'main') {
    if (isFork) {
      errors.push('Fork PRs cannot merge directly into main.');
    } else if (strict && headBranch !== 'fremontderby-gamma') {
      errors.push(
        `Strict mode: PRs into main must come from fremontderby-gamma (got "${headBranch}").`,
      );
    } else if (headBranch !== 'fremontderby-gamma' && !isDruSource(headBranch)) {
      notices.push(
        `Transitional: allowing same-repo "${headBranch}" -> main. Set STRICT_RELEASE_SOURCE_POLICY=1 when Gamma gate is required.`,
      );
    }
  } else if (baseBranch === 'fremontderby-gamma') {
    const trusted =
      /^jfl\//.test(headBranch) ||
      headBranch === 'fremontderby-jfl';
    if (!trusted && !isDruSource(headBranch)) {
      errors.push(
        `PRs into fremontderby-gamma must come from JFL (got "${headBranch}").`,
      );
    }
    if (isFork) {
      errors.push('Fork PRs cannot claim JFL promotion into fremontderby-gamma.');
    }
  }

  return { ok: errors.length === 0, errors, notices, baseBranch, headBranch };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const base = process.env.GITHUB_BASE_REF || process.argv[2];
  const head = process.env.GITHUB_HEAD_REF || process.argv[3];
  const isFork = String(process.env.PR_IS_FORK || 'false') === 'true';
  const strict = String(process.env.STRICT_RELEASE_SOURCE_POLICY || 'false') === 'true';
  const result = evaluateReleaseSourcePolicy({ base, head, isFork, strict });
  for (const n of result.notices || []) console.log(n);
  if (!result.ok) {
    for (const e of result.errors) console.error(e);
    process.exitCode = 1;
  } else {
    console.log(`Release source policy OK: ${result.headBranch} -> ${result.baseBranch}`);
  }
}
