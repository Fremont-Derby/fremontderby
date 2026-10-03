export function campaignFoundationLabel(campaign) {
  return campaign && campaign.missions ? campaign.missions + ' missions ready' : 'Campaign needs missions';
}
