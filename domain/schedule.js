/**
 * Circle method round-robin for fixed 8-team seasons.
 *
 * Complexity: O(n²) matches total — optimal for a complete RR (every pair once).
 * WHY home/away flip on odd rounds: balances who is listed as team A (home/side)
 * without changing the opponent set or requiring a second pass.
 */
export function generateRoundRobin(teamIds) {
  if (!Array.isArray(teamIds) || teamIds.length !== 8) {
    throw new Error('Season 1 schedule requires exactly 8 teams');
  }
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error('Team identifiers must be unique');
  }

  const rotation = [...teamIds];
  const rounds = [];

  for (let roundIndex = 0; roundIndex < teamIds.length - 1; roundIndex += 1) {
    const matches = [];
    for (let i = 0; i < rotation.length / 2; i += 1) {
      let teamA = rotation[i];
      let teamB = rotation[rotation.length - 1 - i];
      // Alternate home/away so fixed-seat circle method does not strand one side.
      if (roundIndex % 2 === 1) {
        const swap = teamA;
        teamA = teamB;
        teamB = swap;
      }
      matches.push({ teamA, teamB });
    }

    rounds.push({ round: roundIndex + 1, matches });

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation.splice(0, rotation.length, fixed, ...rest);
  }

  return rounds;
}

/**
 * Rotate table numbers each round so match slots share physical tables fairly.
 * WHY: static index→table maps put the same pairing slot on the same table all season.
 */
export function assignTablesForRound(tableNumbers, roundIndex) {
  if (!Array.isArray(tableNumbers) || tableNumbers.length === 0) {
    throw new Error('tableNumbers are required');
  }
  const n = tableNumbers.length;
  const offset = ((roundIndex % n) + n) % n;
  return tableNumbers.map((_, index) => tableNumbers[(index + offset) % n]);
}

/**
 * Prove RR completeness: n teams → n-1 rounds, n/2 matches/round, C(n,2) unique pairs.
 */
export function assertCompleteRoundRobin(rounds, teamIds) {
  const n = teamIds.length;
  if (rounds.length !== n - 1) {
    throw new Error(`expected ${n - 1} rounds`);
  }
  const pairs = new Set();
  for (const round of rounds) {
    if (round.matches.length !== n / 2) {
      throw new Error('each round must use every team once');
    }
    const seen = new Set();
    for (const match of round.matches) {
      seen.add(match.teamA);
      seen.add(match.teamB);
      const key = [match.teamA, match.teamB].sort().join(':');
      if (pairs.has(key)) throw new Error(`duplicate pair ${key}`);
      pairs.add(key);
    }
    if (seen.size !== n) throw new Error('round does not include every team');
  }
  if (pairs.size !== (n * (n - 1)) / 2) {
    throw new Error('round robin is incomplete');
  }
}
