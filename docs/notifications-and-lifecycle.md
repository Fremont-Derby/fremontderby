# Notifications and league lifecycle posts

## In-app notifications
- `GET /api/me/notifications`
- `POST /api/me/notifications/:id/read`
- `POST /api/me/notifications/read-all`
- Page: `/notifications`

## Admin broadcast
- `POST /api/admin/notifications/broadcast` `{ title, body, seasonId?, href? }`
- UI: Admin Operations → League broadcast

## Automatic chat / notice events
| Event | Channel |
|-------|---------|
| Practice saved | Team chat (existing) |
| Lineup locked | Team chat + actor notification |
| Dispute requested | Matchup chat (if available) + actor notification |
| Admin broadcast | Notification inbox for audience |

## Product notes
- Team chat unread badges remain on Messages (`/api/me/message-notification-summary`).
- No-show protocol: explicit forfeit slots + matchup messages; admin resolves disputes.
