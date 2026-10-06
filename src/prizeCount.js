export function prizeCount(summary) {
  const count = Number(summary?.player_count || 0);
  const paid = Number(summary?.paid_amount_cents || 0);
  if (count > 16 && paid === 0) return '';
  return String(count);
}
