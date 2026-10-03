export function campaignFoundationLine(campaign = {}) {
  if (!campaign.name) return '';
  return `Campaign foundation: ${campaign.name}.`;
}
export function scorecardDriveLine(drive = {}) {
  if (!drive.name) return '';
  return `Scorecard drive: ${drive.name}.`;
}
