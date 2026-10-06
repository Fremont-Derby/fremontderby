# Messaging product contract

Fremont Derby has exactly three social messaging channels:

1. General Chat
2. Team Chat
3. Direct Messages

Each channel is independently explicit opt-in and defaults OFF. There is no match/matchup chat, captain chat, matchup room, or fourth social-consent toggle.

Required league-night work must remain possible with all social channels OFF. Availability, lineup, scoring, disputes, and narrowly scoped operational Notices/Notifications are product operations, not a backdoor social channel.

Legacy free-form matchup chat is retired. New sends must fail closed even from stale clients, deep links, or direct APIs. Historical content may be retained/read only when required for retention, safety, reporting, or moderation; history must not preserve ongoing sending.

Block/report/moderation boundaries remain applicable to retained historical content. Do not weaken auth, membership, RLS, or privacy boundaries to preserve messaging convenience.

Implementation/acceptance evidence belongs on the active messaging cards; this document owns the enduring channel/privacy model.
