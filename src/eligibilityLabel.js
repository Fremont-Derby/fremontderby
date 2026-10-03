export function eligibilityPageLabel(player) {
  return player && player.qualified ? 'Qualified to play' : 'Not qualified yet';
}
