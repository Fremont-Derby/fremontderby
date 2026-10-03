
export function withoutMissing(unreported = [], missing = []) {
  const ids = new Set(missing.map((row) => row.player_match_id));
  return unreported.filter((row) => !ids.has(row.player_match_id));
}

import { buildFargoExportRecord } from './fargoExport.js';

export function planFargoReports(match, stored = []) {
  const record = buildFargoExportRecord({ ...match, revision: stored.length ? stored.length : 1 });
  const current = stored.find((row) => row.revision === record.revision && row.status !== 'superseded');
  if (current && current.payload?.score?.[0] === record.score[0] && current.payload?.score?.[1] === record.score[1]) {
    return { insert: null, supersede: null, record: current.payload };
  }
  const prior = stored.filter((row) => row.status !== 'superseded').at(-1) || null;
  const next = buildFargoExportRecord({ ...match, revision: prior ? Number(prior.revision) + 1 : 1 }, prior?.payload || null);
  return {
    insert: next,
    supersede: prior ? prior.idempotency_key || prior.idempotencyKey : null,
    record: next,
  };
}


export function missingFargoLinks(matches = []) {
  return matches.filter((match) => !match.playerAFargoId || !match.playerBFargoId).map((match) => ({
    status: 'needs_review',
    player_match_id: match.playerMatchId,
    payload: { playerAName: match.playerAName, playerBName: match.playerBName, playerAId: match.playerAId, playerBId: match.playerBId },
  }));
}

export function fargoReportSummary(rows = []) {
  return {
    unreported: rows.filter((row) => row.status === 'not_sent'),
    missingLinks: rows.filter((row) => row.status === 'needs_review'),
    corrections: rows.filter((row) => row.status === 'superseded'),
  };
}
