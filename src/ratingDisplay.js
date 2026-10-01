/** Human labels for rating seeds — never call Derby math "Official Fargo". */
export function ratingSourceLabel(sourceOrStatus) {
  const raw = String(sourceOrStatus || '').toLowerCase();
  if (raw === 'official_fargo' || raw === 'established') return 'Official Fargo';
  if (raw === 'derby_estimate') return 'Derby estimate';
  if (raw === 'admin_provisional' || raw === 'provisional') return 'Admin provisional';
  if (raw === 'unverified') return 'Unverified';
  return raw ? raw : 'Unknown';
}

export function formatPlayerRatingSeed({
  rating,
  source,
  status,
  robustness,
  confidence,
} = {}) {
  if (rating == null || rating === '') return 'No rating on file';
  const parts = [`${rating}`, ratingSourceLabel(source || status)];
  if (robustness != null && robustness !== '') parts.push(`Robustness ${robustness}`);
  if (confidence) parts.push(`${confidence} confidence`);
  return parts.join(' · ');
}
