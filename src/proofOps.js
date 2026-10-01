export function playwrightPlan() {
  return ['Open the schedule', 'Open the scorecard', 'Record the result'];
}

export function mismatchRecovery(entry) {
  if (!entry?.mismatch) return { blocked: false, text: 'Score accepted.' };
  return { blocked: true, text: 'Check the rack score and submit again.' };
}

export function learningLoop(defect) {
  if (!defect?.id) return null;
  return { text: `Defect ${defect.id} is recorded for the next replay.` };
}

export function harnessMission(mission) {
  if (!mission?.persona || !mission?.task) return null;
  return { text: `${mission.persona}: ${mission.task}` };
}

export function teamBrief(team) {
  if (!team?.name) return null;
  return { text: `You play for ${team.name}${team.captain ? `, captain ${team.captain}` : ''}.` };
}
