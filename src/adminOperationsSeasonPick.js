/** Prefer the active season for admin Operations overview (DRU→Gamma). */
export async function fetchOperationsSeason(table) {
  const activeSeasons = await table(
    'seasons',
    'select=id,name,status,updated_at&status=eq.active&order=updated_at.desc&limit=1',
  );
  if (activeSeasons.rows.length) return activeSeasons;
  return table(
    'seasons',
    'select=id,name,status,updated_at&order=updated_at.desc&limit=1',
  );
}
