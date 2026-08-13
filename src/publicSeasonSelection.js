// Canonical public-season default policy for Schedule, Standings, and Prizes.
// Explicit URL choice wins, then lifecycle relevance. A remembered page-local
// choice is only a safe fallback and must never outrank an active, playoffs,
// registration, or completed league season.
export function choosePublicSeason(
  seasons,
  { explicitId = '', rememberedId = '' } = {},
) {
  const list = Array.isArray(seasons) ? seasons : [];
  const explicit = list.find((season) => season.id === explicitId);
  if (explicit) return explicit;

  for (const status of ['active', 'playoffs', 'registration', 'complete']) {
    const season = list.find((candidate) => candidate.status === status);
    if (season) return season;
  }

  const remembered = list.find((season) => season.id === rememberedId);
  if (remembered) return remembered;

  return list[0] || null;
}

export const publicSeasonSelectionBrowserSource = choosePublicSeason.toString();
