export function missionFrame(mission) {
  if (!mission?.done) return { complete: false, text: mission?.task || 'Finish the task.' };
  return { complete: true, text: 'Mission complete.' };
}

export function levelResult(level) {
  if (!level?.finished) return { obvious: false, text: 'This level is not finished.' };
  return { obvious: true, text: `Level ${level.name} is complete.` };
}

export function scoringControls(selection) {
  if (!selection?.rack) return { visible: false };
  return { visible: true, text: `Rack ${selection.rack} controls stay on screen.` };
}

export function finishedMatchups(rows) {
  return (rows || []).filter((row) => row.finished).map((row) => ({
    matchup: row.matchup,
    points: row.points,
  }));
}

export function dateStatus(nights) {
  return (nights || []).filter((night) => night.date && night.status).map((night) => `${night.date}: ${night.status}`);
}
