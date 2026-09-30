/** Prefer DRU playoffs copy: "appear" instead of "show". */
export function repairPlayoffsCopy(html) {
  return String(html || '').replace(
    'championship show here once playoffs start',
    'championship appear here once playoffs start',
  );
}
