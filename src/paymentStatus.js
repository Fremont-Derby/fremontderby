export function paymentStatusLabel(team) {
  return team && team.paid ? 'Paid' : 'Not paid';
}
