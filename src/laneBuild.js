export function laneBuild({ lane, profile }) {
  if (profile && profile !== lane) return { ok: false, text: `${lane || 'This lane'} cannot build with the ${profile} profile.` };
  return { ok: true, text: `${lane || 'This lane'} builds with its own profile.` };
}

export function publicPullIsolation({ fromFork }) {
  if (fromFork) return { ok: false, text: 'A public pull request cannot start a lane build.' };
  return { ok: true, text: 'This build is from the lane branch.' };
}
