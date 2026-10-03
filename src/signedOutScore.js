export function signedOutScoreLine(score = {}) {
  if (score.signedIn) return '';
  return 'Sign in to score. The unsaved rack is still here.';
}
