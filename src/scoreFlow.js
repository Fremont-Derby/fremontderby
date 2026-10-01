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
