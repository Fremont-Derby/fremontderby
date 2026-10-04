export function ratingReviewLabel(player) {
  return player && player.needsReview ? 'Rating needs review' : 'Rating review is clear';
}
