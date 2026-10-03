export function scorecardLine(card = {}) {
  if (!card.name) return '';
  return `Scorecard: ${card.name}.`;
}
export function replayLine(replay = {}) {
  if (!replay.name) return '';
  return `Replay: ${replay.name}.`;
}
