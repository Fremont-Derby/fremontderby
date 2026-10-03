export function rackStep(step) {
  if (!step?.rack) return { text: 'Name the rack before the score.' };
  return { text: `Rack ${step.rack}: enter the winner, then the next rack unlocks.` };
}

export function selectedScore(score) {
  return { text: score?.selected ? `Selected: ${score.selected}.` : 'Nothing is selected.' };
}

export function disputedResult(result) {
  if (result?.disputed) return { authoritative: false, text: 'Disputed. Not the race result.' };
  return { authoritative: true, text: result?.winner ? `${result.winner} won.` : 'No result yet.' };
}

export function outsideTap(target) {
  return { closeMenu: target !== 'menu', keepDock: true };
}

export function terminalMismatch(score) {
  if (score?.terminal && score?.open) return { ok: false, text: 'A finished rack cannot stay open.' };
  return { ok: true, text: 'Score state matches.' };
}

export function submitResult(result) {
  return { done: Boolean(result?.complete), text: result?.complete ? 'Result submitted.' : 'Finish every rack first.' };
}

export function missionTask(task) {
  return { text: task?.ask || 'Show the task, not the fixture.' };
}

export function stuckPath(path) {
  return { text: path?.recover || 'Go back to the schedule.' };
}

export function scoreNeedsBothTeams(match) {
  if (!match?.teamAId || !match?.teamBId) return { ok: false, text: 'Set both teams before scoring.' };
  if (!match?.lineupA || !match?.lineupB) return { ok: false, text: 'Both teams need a lineup before scoring.' };
  return { ok: true, text: 'Both teams are set.' };
}

export function practiceScoreAllowed(payments) {
  const rows = payments || [];
  if (!rows.length || rows.some((row) => !row || row.status === 'unpaid' || !row.status)) {
    return { ok: false, text: 'Record payment or a practice waiver before scoring.' };
  }
  return { ok: true, text: 'Payment is on file.' };
}
