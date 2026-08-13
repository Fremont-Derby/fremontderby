// Canonical public-season default policy for Schedule, Standings, and Prizes.
// Explicit URL choice wins, then a previously explicit remembered choice, then
// active/playoffs -> registration -> complete -> first remaining public season.
export function choosePublicSeason(
  seasons,
  { explicitId = '', rememberedId = '' } = {},
) {
  const list = Array.isArray(seasons) ? seasons : [];
  const explicit = list.find((season) => season.id === explicitId);
  if (explicit) return explicit;

  const remembered = list.find((season) => season.id === rememberedId);
  if (remembered) return remembered;

  for (const status of ['active', 'playoffs', 'registration', 'complete']) {
    const season = list.find((candidate) => candidate.status === status);
    if (season) return season;
  }

  return list[0] || null;
}

export const publicSeasonSelectionBrowserSource = choosePublicSeason.toString();
