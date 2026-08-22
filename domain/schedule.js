export function generateRoundRobin(teamIds) {
  if (!Array.isArray(teamIds) || teamIds.length !== 8) {
    throw new Error("Season 1 schedule requires exactly 8 teams");
  }
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error("Team identifiers must be unique");
  }

  const rotation = [...teamIds];
  const rounds = [];

  for (let roundIndex = 0; roundIndex < teamIds.length - 1; roundIndex += 1) {
    const matches = [];
    for (let i = 0; i < rotation.length / 2; i += 1) {
      matches.push({
        teamA: rotation[i],
        teamB: rotation[rotation.length - 1 - i],
      });
    }

    rounds.push({ round: roundIndex + 1, matches });

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  return rounds;
}
