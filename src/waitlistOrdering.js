/**
 * Deterministic waitlist ordering for qualified teams (#409).
 * Never uses Fargo/strength — only override rank, first_qualified_at, submitted_at, id.
 */
export function compareWaitlistEntries(a, b) {
  const rankA = a.waitlistRankOverride ?? a.waitlist_rank_override;
  const rankB = b.waitlistRankOverride ?? b.waitlist_rank_override;
  const hasRankA = rankA != null && Number.isFinite(Number(rankA));
  const hasRankB = rankB != null && Number.isFinite(Number(rankB));
  if (hasRankA && hasRankB && Number(rankA) !== Number(rankB)) {
    return Number(rankA) - Number(rankB);
  }
  if (hasRankA !== hasRankB) return hasRankA ? -1 : 1;

  const fqA = Date.parse(a.firstQualifiedAt || a.first_qualified_at || '') || Number.POSITIVE_INFINITY;
  const fqB = Date.parse(b.firstQualifiedAt || b.first_qualified_at || '') || Number.POSITIVE_INFINITY;
  if (fqA !== fqB) return fqA - fqB;

  const subA = Date.parse(a.submittedAt || a.submitted_at || '') || Number.POSITIVE_INFINITY;
  const subB = Date.parse(b.submittedAt || b.submitted_at || '') || Number.POSITIVE_INFINITY;
  if (subA !== subB) return subA - subB;

  const idA = String(a.id || a.applicationId || a.application_id || '');
  const idB = String(b.id || b.applicationId || b.application_id || '');
  return idA.localeCompare(idB);
}

export function orderWaitlist(entries) {
  return [...(entries || [])].sort(compareWaitlistEntries).map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
}

export function nextWaitlistPromotion(entries) {
  const ordered = orderWaitlist(entries);
  return ordered[0] || null;
}
