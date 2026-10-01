const OLD_PICKER = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound))return requestedRound;";
const NEW_PICKER = "requestedRound&&rounds.some((round)=>round.roundId===requestedRound&&!['finalized','corrected'].includes(round.teamMatchStatus)))return requestedRound;";

export function repairLineupScript(html) {
  return String(html || '').replace(OLD_PICKER, NEW_PICKER);
}
