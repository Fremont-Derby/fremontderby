export function ratingStatusLabel(player) {
  return player && player.rating ? 'Rating ' + player.rating : 'Rating is missing';
}
