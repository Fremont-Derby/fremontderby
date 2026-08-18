/**
 * #176 Communication engagement without exposing private messages.
 * Aggregate counts only.
 */
export function summarizeEngagement({ threads = 0, messages = 0, participants = 0, openReports = 0 } = {}) {
  return {
    threads: Number(threads) || 0,
    messages: Number(messages) || 0,
    participants: Number(participants) || 0,
    openReports: Number(openReports) || 0,
    // No content, no author ids in the aggregate surface
  };
}
