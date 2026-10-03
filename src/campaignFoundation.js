export function campaignFoundationLine(campaign = {}) {
  if (!campaign.name) return '';
  return `Campaign: ${campaign.name}.`;
}
