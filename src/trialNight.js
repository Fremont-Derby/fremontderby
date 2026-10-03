export function trialNightLabel(player) {
  const nights = Number(player && player.trialNights || 0);
  return nights >= 2 ? 'Trial nights complete' : nights + ' of 2 trial nights';
}
