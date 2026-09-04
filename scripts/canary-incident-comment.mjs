/** Shared text for #1183 canary comments. Keep this free of secrets. */

export function formatCanaryIncidentComment({
  runUrl = '',
  failed = [],
  workCard = '#2173',
  parentCard = '#1183',
} = {}) {
  const rows = Array.isArray(failed) ? failed : [];
  const lines = [
    'Scheduled public-surface canary failed.',
    '',
    runUrl ? `Workflow: ${runUrl}` : null,
    '',
    `Failed checks (${rows.length}):`,
  ].filter((line) => line !== null);

  if (!rows.length) {
    lines.push('- (no structured failure rows; see workflow logs)');
  } else {
    for (const row of rows.slice(0, 20)) {
      const parts = [
        row.host || 'host?',
        row.kind || 'check',
        row.status != null ? `HTTP ${row.status}` : null,
        row.url || null,
        row.error || null,
      ].filter(Boolean);
      lines.push(`- ${parts.join(' — ')}`);
    }
  }

  lines.push(
    '',
    `Parent canary: ${parentCard}. Work card: ${workCard}.`,
    'Do not close the parent until a scheduled canary run is green.',
  );
  return lines.join('\n');
}
