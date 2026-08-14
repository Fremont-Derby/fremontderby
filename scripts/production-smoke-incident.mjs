export const PRODUCTION_SMOKE_STATUS_MARKER = '<!-- production-smoke-status-v1 -->';
export const MAX_SMOKE_DIAGNOSTIC_CHARACTERS = 6000;

const FALLBACK_DIAGNOSTICS = 'Smoke output was unavailable.';
const GITHUB_ACTIONS_BOT_LOGIN = 'github-actions[bot]';

export function sanitizeSmokeDiagnostics(diagnostics) {
  const normalized = String(diagnostics ?? '').trim() || FALLBACK_DIAGNOSTICS;
  const safe = normalized.replaceAll('```', '``\u200b`');
  return safe.slice(-MAX_SMOKE_DIAGNOSTIC_CHARACTERS);
}

export function findLatestProductionSmokeStatusComment(comments) {
  if (!Array.isArray(comments)) return null;

  return comments.reduce((latest, comment) => {
    const isOwnedStatus = Number.isInteger(comment?.id)
      && comment?.user?.login === GITHUB_ACTIONS_BOT_LOGIN
      && typeof comment?.body === 'string'
      && comment.body.startsWith(`${PRODUCTION_SMOKE_STATUS_MARKER}\n`);
    if (!isOwnedStatus) return latest;
    if (!latest || comment.id > latest.id) return comment;
    return latest;
  }, null);
}

export function buildProductionSmokeFailureBody({ sha, runUrl, diagnostics }) {
  if (!sha) throw new TypeError('sha is required');
  if (!runUrl) throw new TypeError('runUrl is required');

  return [
    PRODUCTION_SMOKE_STATUS_MARKER,
    `Production smoke failed for main commit \`${sha}\`.`,
    '',
    `Workflow: ${runUrl}`,
    '',
    'Expected proof:',
    '- `/health` is healthy and reports the exact Git SHA as `versionTag`;',
    '- `/health/environment` reports `production` and all readiness checks pass;',
    '- `/demo` serves the current Try a League Night surface.',
    '',
    'Observed smoke diagnostics:',
    '```text',
    sanitizeSmokeDiagnostics(diagnostics),
    '```',
    '',
    'Do not promote another release until the deployed Worker/version and environment binding are reconciled.',
    '',
    '_This GitHub Actions status comment is maintained automatically; later failures update it in place._',
  ].join('\n');
}
