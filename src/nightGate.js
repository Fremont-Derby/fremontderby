export function nightStep(step) {
  return { ok: Boolean(step?.name && step?.owner), text: step?.name ? `${step.name} is owned by ${step.owner}.` : 'Name the night step.' };
}
export function triageLabel(defect) {
  return { ok: Boolean(defect?.label && defect?.issue), text: defect?.issue ? `Linked to #${defect.issue}.` : 'Link the defect.' };
}
export function personaMission(mission) {
  return { ready: Boolean(mission?.persona && mission?.task), text: mission?.task || 'Name the task.' };
}
export function bootstrapStatus(response) {
  return { ok: response?.status !== 405, text: response?.status === 405 ? 'Season bootstrap was blocked.' : 'Bootstrap answered.' };
}
export function nextAction(page) {
  const actions = page?.actions || [];
  return { ok: actions.length <= 1, text: actions[0] || 'No action.' };
}
export function onionLayer(layer) {
  return { ok: Number.isInteger(layer?.gate) && layer.gate >= 0, text: layer?.gate === 0 ? 'Start at the baseline.' : `Gate ${layer?.gate}.` };
}
export function supportInfra(row) {
  return { ok: Boolean(row?.evidence && row?.persona), text: 'Support needs evidence and a persona.' };
}
export function serviceDown(message) {
  return { retry: true, text: message || 'The league service is unavailable. Try again.' };
}
