export function repairAdminPlayersScript(html) {
  return String(html || '')
    .replace(
      /confirm\(error\.message\+'[\s\S]*?Create a separate player with the same name anyway\?'\)/,
      "confirm(error.message+'\\n\\nCreate a separate player with the same name anyway?')",
    )
    .replace(
      /placeholder="Type part of a name[^"]*"/,
      'placeholder="Search by player or team"',
    );
}
