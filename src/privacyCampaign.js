export function privacyContractLine(contract = {}) {
  if (!contract.field) return '';
  return `Privacy: ${contract.field} is stored as a label, not a value.`;
}
export function campaignLine(campaign = {}) {
  if (!campaign.name) return '';
  return `Campaign: ${campaign.name}.`;
}
