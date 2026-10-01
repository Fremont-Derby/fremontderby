export function testerFeedback(note) {
  if (!note?.text || !note?.lane || !note?.sha) return null;
  return { text: `${note.lane} at ${note.sha}: ${note.text}` };
}

export function visiblePath(workflow) {
  if (!workflow?.label || !workflow?.href) return null;
  return { text: `${workflow.label} is on the page, not a hidden link.` };
}

export function failedGate(defect) {
  if (!defect?.gate || !defect?.test) return null;
  return { text: `${defect.gate} failed ${defect.test}.` };
}

export function incidentStep(kind) {
  const steps = { 'score-down': 'Enter the score by hand.', 'login-down': 'Use the saved session and retry.' };
  return { text: steps[kind] || 'Record the failure and stop.' };
}

export function registrationExpiry(row) {
  if (!row?.expires) return { active: true };
  return { active: false, text: 'This registration is expired and stays out of the public read.' };
}
