export function raceTargets(ratingA, ratingB, chart) {
  if (!Array.isArray(chart) || chart.length === 0) {
    throw new Error("Race chart is required");
  }

  const diff = Math.abs(ratingA - ratingB);
  const band = chart.find((entry) => diff <= entry.maxDiff) ?? chart[chart.length - 1];

  if (!band || !Number.isInteger(band.strongerTo) || !Number.isInteger(band.weakerTo)) {
    throw new Error("Invalid race chart");
  }

  if (ratingA === ratingB) {
    return { a: band.strongerTo, b: band.strongerTo };
  }

  return ratingA > ratingB
    ? { a: band.strongerTo, b: band.weakerTo }
    : { a: band.weakerTo, b: band.strongerTo };
}

export function createMatch({
  ratingA,
  ratingB,
  chart,
  openingBlockLength = 3,
  lagWinner,
  lagChoice,
  openingDiscipline,
}) {
  if (!['A', 'B'].includes(lagWinner)) {
    throw new Error("lagWinner must be A or B");
  }
  if (!['discipline', 'break'].includes(lagChoice)) {
    throw new Error("lagChoice must be discipline or break");
  }
  if (!['8-ball', '9-ball'].includes(openingDiscipline)) {
    throw new Error("openingDiscipline must be 8-ball or 9-ball");
  }
  if (!Number.isInteger(openingBlockLength) || openingBlockLength < 1) {
    throw new Error("openingBlockLength must be a positive integer");
  }

  const targets = raceTargets(ratingA, ratingB, chart);
  const firstBreak = lagChoice === 'break'
    ? lagWinner
    : lagWinner === 'A' ? 'B' : 'A';

  return {
    ratings: { a: ratingA, b: ratingB },
    targets,
    openingBlockLength,
    openingDiscipline,
    currentDiscipline: openingDiscipline,
    firstBreak,
    score: { a: 0, b: 0 },
    racks: [],
    winner: null,
  };
}

export function recordRack(match, winner) {
  if (match.winner) {
    throw new Error("Match is already complete");
  }
  if (!['A', 'B'].includes(winner)) {
    throw new Error("winner must be A or B");
  }

  const next = structuredClone(match);
  const key = winner.toLowerCase();
  next.score[key] += 1;
  next.racks.push({
    number: next.racks.length + 1,
    discipline: next.currentDiscipline,
    winner,
  });

  if (next.score.a >= next.targets.a || next.score.b >= next.targets.b) {
    next.winner = next.score.a >= next.targets.a ? 'A' : 'B';
    return next;
  }

  if (next.racks.length === next.openingBlockLength) {
    next.currentDiscipline = next.openingDiscipline === '8-ball' ? '9-ball' : '8-ball';
  }

  return next;
}
