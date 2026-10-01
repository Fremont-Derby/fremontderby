export function surveySummary(rows) {
  return { count: (rows || []).length, text: `${(rows || []).length} recent surveys.` };
}
export function surveyApi(actor) {
  return { ok: actor?.role === 'admin', text: actor?.role === 'admin' ? 'Survey results.' : 'Admin only.' };
}
export function missionBatch(missions) {
  return { ok: (missions || []).length === 6, text: (missions || []).length === 6 ? 'Six missions in a row.' : 'Batch needs six missions.' };
}
export function runnerDone(run) {
  return { ok: Boolean(run?.complete && run?.mobile), text: run?.complete ? 'Runner complete on a phone frame.' : 'Runner is not complete.' };
}
export function missionChrome(chrome) {
  return { ok: Boolean(chrome?.task && chrome?.abort), text: chrome?.abort ? 'Abort is visible.' : 'Abort is missing.' };
}
export function replaceDrive(path) {
  return { ok: path !== 'test-drive', text: path === 'test-drive' ? 'Test Drive is not the path.' : 'Mission is the path.' };
}
export function previewPath(path) {
  return { ok: path !== 'preview', text: path === 'preview' ? 'Preview is not the tester path.' : 'Tester path is live.' };
}
export function launchCopy(copy) {
  return { text: copy || 'Start the mission.' };
}
export function campaignBase(campaign) {
  return { ok: Boolean(campaign?.persona && campaign?.mission), text: 'Campaign needs a persona and a mission.' };
}
export function campaignBuild(campaign) {
  return { text: campaign?.name || 'Name the campaign.' };
}
export function replayCompare(before, after) {
  return { changed: before !== after, text: before === after ? 'No change.' : 'Replay differs.' };
}
export function shadowRank(rank) {
  return { shadow: true, text: rank ? `Shadow rank ${rank}.` : 'Shadow rank is empty.' };
}
export function datasetRow(row) {
  return { ok: Boolean(row?.id) && !row?.secret, text: row?.secret ? 'Dataset cannot hold a secret.' : 'Row is safe.' };
}
export function cluster(items) {
  return { text: `${(items || []).length} items in this cluster.` };
}
export function triageLabel(item) {
  return { ok: Boolean(item?.label && item?.issue), text: item?.issue ? `Linked to #${item.issue}.` : 'Link the defect.' };
}
export function qaExplorer(run) {
  return { text: run?.id ? `Run ${run.id}.` : 'Name the run.' };
}
export function clientError(error) {
  return { text: error?.public || 'Something went wrong.', ref: error?.ref || null };
}
export function telemetryContract(event) {
  return { ok: Boolean(event?.name) && !event?.phone, text: event?.phone ? 'Telemetry cannot hold a phone.' : 'Event is named.' };
}
export function scorecardDrive(step) {
  return { text: step || 'Enter the rack winner.' };
}
export function validationLoop(round) {
  return { text: round ? `Round ${round}.` : 'Name the round.' };
}
