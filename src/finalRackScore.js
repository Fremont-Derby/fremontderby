export function finalRackScore(match) {
  if (!match || !['finalized', 'corrected'].includes(String(match.status || ''))) return '';
  const a = Number(match.racksA ?? match.racks_a);
  const b = Number(match.racksB ?? match.racks_b);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a + b < 1) return '';
  return `Racks ${a}–${b}`;
}
