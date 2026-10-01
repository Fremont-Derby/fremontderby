/**
 * Privacy scrub policy applied to gamma after production import (#577).
 * SQL runs only against the gamma schema on the non-production project.
 */

export const scrubSqlStatements = [
  // Contact fields — neutralize real phones/emails for general tester access
  `UPDATE gamma.players SET phone = NULL WHERE phone IS NOT NULL`,
  `UPDATE gamma.profiles SET phone = NULL WHERE phone IS NOT NULL`,
  // Synthetic email pattern if email columns exist (ignore missing via DO block in runner)
];

export function describeScrubPolicy() {
  return {
    version: 1,
    actions: [
      'Null out player/profile phone numbers in gamma schema',
      'Never copy production service-role keys into the gamma Worker',
      'Refresh is one-way: production read → gamma write only',
    ],
  };
}
