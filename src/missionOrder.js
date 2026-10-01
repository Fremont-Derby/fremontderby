export function nextMission(done, order) {
  return order.find(step => !done.includes(step)) || null;
}
